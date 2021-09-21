import CashingService, { ICashInFee } from '../../../services/cashing/cashing-service';

import { useEffect, useState } from 'react';
import TransactionForm from './transaction-form';
import Format from '../../../services/utility/format';
import SessionService from '../../../services/session/session-service';

const CashIn = () => {
  const [cashingService] = useState<CashingService>(new CashingService());
  const [sessionService] = useState<SessionService>(new SessionService());
  const [cashInFees, setCashInFees] = useState<ICashInFee | null>(null);
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    const email = sessionService.usrSession?.userEmail;

    if (!email) {
      console.error('No active user session!');
      return;
    };

    cashingService.getCashInFees(email)
      .then(fees => setCashInFees(fees));
  }, []);

  return cashInFees &&
    <TransactionForm
      title='Cash In'
      amount={amount}
      onChange={amt => setAmount(amt)}
      total={cashingService.calcCashInFee(cashInFees, amount).total}
      comission={cashingService.calcCashInFee(cashInFees, amount).fee}
      infoMsg={`Fees: ${cashInFees.percents}% or ${Format.currency(cashInFees.max.amount)}`}
      onTransaction={async amt => await cashingService.doCashIn(sessionService.usrSession?.userEmail || '', amount)}
    />
}

export default CashIn;
