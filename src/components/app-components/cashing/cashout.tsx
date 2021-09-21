import CashingService, { ICashOutFeeLegal, ICashOutFeeNatural } from '../../../services/cashing/cashing-service';

import { useEffect, useState } from 'react';
import TransactionForm from './transaction-form';
import SessionService from '../../../services/session/session-service';

const CashOut = () => {
  const [cashingService] = useState<CashingService>(new CashingService());
  const [sessionService] = useState<SessionService>(new SessionService());
  const [cashOutFees, setCashOutFees] = useState<ICashOutFeeLegal | ICashOutFeeNatural | null>(null);

  const [total, setTotal] = useState(0);
  const [amount, setAmount] = useState(0);
  const [comission, setComission] = useState(0);
  const [description, setDescription] = useState('');

  useEffect(() => {
    const email = sessionService.usrSession?.userEmail;

    if (!email) {
      console.error('No active user session!');
      return;
    };
  }, []);

  useEffect(() => {
    const email = sessionService.usrSession?.userEmail;

    if (!email) {
      console.error('No active user session!');
      return;
    }

    const calcFees = async () => {
      const fees = await cashingService.getCashOutFees();

      if (!fees) return;

      if ((fees as ICashOutFeeNatural).week_limit) {
        const transactions = await cashingService.getTransactions(email);
        const res = await cashingService.weeklyLimitReached(transactions, fees as ICashOutFeeNatural, amount);
        if (res.reached) {
          setDescription(`Weekly limit of ${(fees as ICashOutFeeNatural).week_limit.amount} reached. 
          Your next transaction will be charged with ${(fees as ICashOutFeeNatural).percents}% of it's value!`);
        } else {
          setDescription('');
        }
      }

      setCashOutFees(fees);
      const res = await cashingService.calcCashOutFee(fees, amount);
      setTotal(res.total);
      setComission(res.fee);
    };
    calcFees();

  }, [amount]);

  return cashOutFees &&
    <TransactionForm
      title='Cash Out'
      amount={amount}
      onChange={amt => setAmount(amt)}
      total={total}
      comission={comission}
      infoMsg={description}
      onTransaction={async amt => await cashingService.doCashOut(sessionService.usrSession?.userEmail || '', amount)}
    />
}
export default CashOut;