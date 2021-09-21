import { render, screen } from '@testing-library/react';
import App from './App';
import CashingService from './services/cashing/cashing-service';
import SessionService from './services/session/session-service';

let cashInFee = {
  percents: 0.03,
  max: {
    amount: 5,
    currency: 'EUR'
  }
};
let cashOutNatural = {
  percents: 0.3,
  week_limit: {
    amount: 1000,
    currency: 'EUR'
  }
};
let cashOutLegal = {
  percents: 0.3,
  min: {
    amount: 0.5,
    currency: 'EUR'
  }
}
let cashingService;
beforeAll(() => {
  cashingService = new CashingService();
});

test('calc cash in fee less than max', async () => {

  const amount = 10;
  const result = await cashingService.calcCashInFee(cashInFee, amount);

  expect(result).toStrictEqual({
    fee: 0.3,
    total: 9.7
  })
});

test('calc cash in fee grater than max', async () => {
  const amount = 1000;
  const result = await cashingService.calcCashInFee(cashInFee, amount);

  expect(result).toStrictEqual({
    fee: 5,
    total: 995
  })
});

test('calc cash out fee natural within weekly limit', async () => {
  const transactions = [{
    id: 1,
    data: {
      fee: 3,
      total: 97
    },
    date: 'Tue Sep 21 2021 16:28:15 GMT+0300'
  },
  {
    id: 2,
    data: {
      fee: 5,
      total: 100
    },
    date: 'Tue Sep 21 2021 16:57:31 GMT+0300)'
  },
  {
    id: 3,
    data: {
      fee: 0,
      total: -20
    },
    date: 'Tue Sep 21 2021 16:57:40 GMT+0300'
  }];
  const res = await cashingService.calcCashOutFeeNatural(transactions, cashOutNatural, 100);
  expect(res).toStrictEqual({
    fee: 0,
    total: 100
  });
});

test('calc cash out fee natural weekly limit exceeded', async () => {
  const transactions = [{
    id: 1,
    data: {
      fee: 3,
      total: 97
    },
    date: 'Tue Sep 21 2021 16:28:15 GMT+0300'
  },
  {
    id: 2,
    data: {
      fee: 5,
      total: 4995
    },
    date: 'Tue Sep 21 2021 16:57:31 GMT+0300)'
  },
  {
    id: 3,
    data: {
      fee: 0,
      total: -1000
    },
    date: 'Tue Sep 21 2021 16:57:40 GMT+0300'
  }];
  const res = await cashingService.calcCashOutFeeNatural(transactions, cashOutNatural, 100);
  expect(res).toStrictEqual({
    fee: 30,
    total: 70
  });
});

test('calc cash out fee legal above min', async () => {
  const res = await cashingService.calcCashOutFeeLegal(cashOutLegal, 100);
  expect(res).toStrictEqual({
    fee: 30,
    total: 70
  });
});

test('calc cash out fee legal below min', async () => {
  const res = await cashingService.calcCashOutFeeLegal(cashOutLegal, 1);
  expect(res).toStrictEqual({
    fee: 0.5,
    total: 0.5
  });
});