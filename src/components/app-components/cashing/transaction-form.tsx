import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

import Format from '../../../services/utility/format';

import { ChangeEvent, SyntheticEvent, useState } from 'react';
import { MAX_TRANSACTION_AMOUNT } from '../../../services/cashing/constants';

export interface ITransactionProps {
  title: string,
  total: number,
  amount: number,
  comission: number,
  infoMsg: string,
  onChange: (amount: number) => void,
  onTransaction: (amount: number) => Promise<void>;
}

const TransactionForm = ({ title, total, amount, comission, infoMsg, onChange, onTransaction }: ITransactionProps) => {
  const [value, setValue] = useState('');
  const [success, setSuccess] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [cashInMsg, setCashInMsg] = useState<string | null>(null);

  const handleChange = (evt: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let raw = evt.target.value;

    if (!raw.match(`^[0-9]*(?:\\.|\\.[0-9]{1,2})?$`)) return;

    const parsed = parseFloat(evt.target.value);

    if (parsed >= MAX_TRANSACTION_AMOUNT) {
      setAlertMsg(`Transaction limit is ${Format.currency(MAX_TRANSACTION_AMOUNT)}`);
      return;
    }

    const result = isNaN(parsed) ? 0 : parsed;
    onChange(result);
    setAlertMsg('');
    setValue(raw);
  }

  const handleSBClose = (event: SyntheticEvent<Element, Event>) => {
    setCashInMsg(null);
  };

  return <>
    <Typography sx={{ mb: 2 }} variant="h4" noWrap component="div">
      {title}
    </Typography>

    <FormControl>

      <InputLabel htmlFor='cash-in-amount'>Amount</InputLabel>
      <OutlinedInput
        placeholder='0.00'
        id='cash-in-amount'
        value={value}
        onChange={(evt) => handleChange(evt)}
        startAdornment={
          <InputAdornment position="start">€</InputAdornment>
        }
        label="Amount"
      />

    </FormControl>

    <div>
      <small>{infoMsg}</small>
    </div>

    <Typography sx={{ mt: 1 }} variant="h6" noWrap component="div">
      Commission: {Format.currency(comission)}
    </Typography>

    <Typography variant="h6" noWrap component="div">
      Total: {Format.currency(total)}
    </Typography>

    {alertMsg && <Alert severity="error">{alertMsg}</Alert>}

    <Divider sx={{ my: 2 }} />

    <Button variant="contained" onClick={async () => {
      try {
        await onTransaction(amount);
        setCashInMsg('Transaction Successful.');
        setSuccess(true);
      } catch (err: any) {
        setCashInMsg(err.message);
        setSuccess(false);
      }
    }}>{title}</Button>
    <Snackbar open={!!cashInMsg} autoHideDuration={3000} onClose={handleSBClose}>
      <Alert onClose={handleSBClose} severity={`${success ? 'success' : 'error'}`} sx={{ width: '100%' }}>
        {cashInMsg}
      </Alert>
    </Snackbar>
  </>
}

export default TransactionForm;
