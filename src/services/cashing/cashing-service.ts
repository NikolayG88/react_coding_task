import { MAX_TRANSACTION_AMOUNT, MIN_TRANSACTION_AMOUNT, TRANSACTION_STORAGE } from "./constants";
import SessionService from "../session/session-service";
import HttpService from "../http/http-service";

export interface ITransactionFeeConstraint {
  amount: number,
  currency: string,
}

export interface ITransactionFee {
  percents: number
}

export interface ICashInFee extends ITransactionFee {
  max: ITransactionFeeConstraint
}

export interface ICashOutFeeNatural extends ITransactionFee {
  week_limit: ITransactionFeeConstraint
}

export interface ICashOutFeeLegal extends ITransactionFee {
  min: ITransactionFeeConstraint
}

export interface ITransactionData {
  fee: number,
  total: number
}

export interface ITransaction {
  id: number,
  data: ITransactionData,
  date: string
}

export interface ILimitCheckResult {
  reached: boolean,
  amtToCharge: number
}

class CashingService {

  seessionService = new SessionService();
  httpService = new HttpService();

  async getTransactions(email: string): Promise<ITransaction[]> {
    return JSON.parse(localStorage.getItem(`${TRANSACTION_STORAGE}_${email}`) || '[]');
  }

  private async setTransactions(email: string, tranArr: ITransaction[]) {
    localStorage.setItem(`${TRANSACTION_STORAGE}_${email}`, JSON.stringify(tranArr));
  }

  private async saveTransaction(email: string, tranData: ITransactionData) {
    const tranStore = await this.getTransactions(email);
    const transaction: ITransaction = {
      id: tranStore.length + 1,
      data: tranData,
      date: Date()
    }

    tranStore.push(transaction);
    await this.setTransactions(email, tranStore);
  }

  subscribeToUpdateEvents(listener: EventListener) {
    // Listen for the event.
    document.addEventListener('transaction', listener, false);
  }

  private dispatchUpdateEvent() {
    const event = new Event('transaction');
    // Dispatch the event.
    document.dispatchEvent(event);
  }

  calcCashInFee(tFee: ICashInFee, amount: number): ITransactionData {
    const fee = amount * tFee.percents > tFee.max.amount
      ? tFee.max.amount
      : amount * tFee.percents;
    const total = amount - fee;

    return {
      fee: fee,
      total: total
    }
  }

  async calcCashOutFee(tFee: ICashOutFeeNatural | ICashOutFeeLegal, amount: number): Promise<ITransactionData> {
    let result = {
      fee: 0,
      total: 0
    };

    const email = this.seessionService.usrSession?.userEmail;
    if (!email) throw Error('No active user session');

    if ((tFee as ICashOutFeeNatural).week_limit) {
      const transactions = await this.getTransactions(email)
      result = await this.calcCashOutFeeNatural(transactions, tFee as ICashOutFeeNatural, amount);
    }

    if ((tFee as ICashOutFeeLegal).min)
      result = await this.calcCashOutFeeLegal(tFee as ICashOutFeeLegal, amount);

    return result;
  }

  // Get first day of current week
  private getMonday(): Date {
    const date = new Date();
    var day = date.getDay(),
      diff = date.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date(date.setDate(diff));
  }

  private getSunday(): Date {
    const monday = this.getMonday();
    return new Date(monday.setDate(monday.getDate() + 6));
  }

  async weeklyLimitReached(transactions: ITransaction[], tFee: ICashOutFeeNatural, amount: number): Promise<ILimitCheckResult> {
    const monday = this.getMonday().getDate();
    const sunday = this.getSunday().getDate();

    // get transactions for the week
    const weeklyTotals = transactions
      .filter(t => {
        const tranDay = new Date(t.date).getDate();
        // Take all weekly cash out transactions with no fee
        return monday < tranDay && tranDay <= sunday && t.data.fee === 0 && t.data.total < 0;
      })
      .map(t => t.data.total);
    // calculate weekly transaction amt
    const weeklyAmt = (weeklyTotals.length ? weeklyTotals.reduce((prev, curr) => prev + curr) : 0) * -1;

    // if less than weekly max no fee
    if (weeklyAmt >= tFee.week_limit.amount)
      return {
        reached: true,
        amtToCharge: amount
      };

    if (weeklyAmt + amount > tFee.week_limit.amount)
      return {
        reached: true,
        amtToCharge: amount + weeklyAmt - tFee.week_limit.amount
      }

    return {
      reached: false,
      amtToCharge: amount
    }
  }

  async calcCashOutFeeNatural(transactions: ITransaction[], tFee: ICashOutFeeNatural, amount: number): Promise<ITransactionData> {
    let fee = 0;
    let total = 0;

    const res = await this.weeklyLimitReached(transactions, tFee, amount);

    // if less than weekly max no fee
    if (res.reached) {
      fee = res.amtToCharge * tFee.percents;
      total = amount - fee;
    }

    return {
      fee: fee,
      total: total
    }
  }

  private async calcCashOutFeeLegal(tFee: ICashOutFeeLegal, amount: number): Promise<ITransactionData> {
    if (!amount) return {
      fee: 0,
      total: 0
    };

    let fee = amount * tFee.percents;

    if (fee < tFee.min.amount) fee = 0.5;

    return {
      fee: fee,
      total: amount - fee
    }
  }

  async doCashIn(email: string, amount: number) {
    if (amount < MIN_TRANSACTION_AMOUNT) throw Error('Minimum transaction amount exceeded!');
    if (amount > MAX_TRANSACTION_AMOUNT) throw Error('Max transaction amount exceeded!');

    const fees = await this.getCashInFees(email);

    const res = this.calcCashInFee(fees, amount);

    await this.saveTransaction(email, res);

    this.dispatchUpdateEvent();
  }

  async doCashOut(email: string, amount: number) {
    if (amount < MIN_TRANSACTION_AMOUNT) throw Error('Minimum transaction amount exceeded!');
    if (amount > MAX_TRANSACTION_AMOUNT) throw Error('Max transaction amount exceeded!');
    if (amount > await this.getUserBallance(email)) throw Error('Trying to cash out more than currently in ballance!');

    const fees = await this.getCashOutFees();

    if (!fees) throw new Error('Error geting user commission fees!');

    const res = await this.calcCashOutFee(fees, amount);

    // Negate for cash out transactions
    res.total = res.total * -1;
    await this.saveTransaction(email, res);

    this.dispatchUpdateEvent();
  }

  async getCashInFees(email: string): Promise<ICashInFee> {
    //TODO get fee % and max fee result from API
    return this.httpService.GetRequest('cash-in');
  }

  async getCashOutFees(): Promise<ICashOutFeeNatural | ICashOutFeeLegal | null> {
    const session = this.seessionService.usrSession;

    if (session?.userType === 'natural')
      return await this.httpService.GetRequest('cash-out-natural');

    if (session?.userType === 'legal')
      return await this.httpService.GetRequest('cash-out-juridical');

    return null;
  }

  async getUserBallance(email: string): Promise<number> {
    const tranStore = await this.getTransactions(email);

    if (!tranStore.length) return 0;

    const res = tranStore.map(t => t.data.total).reduce((prev, cur) => {
      return prev + cur;
    });

    return Math.round((res + Number.EPSILON) * 100) / 100;
  }
}

export default CashingService;
