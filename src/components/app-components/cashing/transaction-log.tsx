import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import { green, orange } from '@mui/material/colors';
import OutboxIcon from '@mui/icons-material/Outbox';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';

import { useEffect, useState } from 'react';
import CashingService from '../../../services/cashing/cashing-service';
import SessionService from '../../../services/session/session-service';
import { ITransaction } from '../../../services/cashing/cashing-service';
import Format from '../../../services/utility/format'

const TransactionLog = () => {
  const sessionService = new SessionService();
  const cashingService = new CashingService();

  const [transactions, setTransactions] = useState<ITransaction[] | null>(null);

  useEffect(() => {
    (async () => {
      const email = await sessionService.usrSession?.userEmail;
      if (!email) {
        console.warn('No active user session!');
        return;
      }
      const trans = await cashingService.getTransactions(email);
      setTransactions(trans);
    })();
  }, []);

  return transactions && (
    <List
      sx={{
        width: '100%',
        maxWidth: 360,
        bgcolor: 'background.paper',
      }}
    >
      {transactions?.map(t => {
        return <>
          <ListItem>
            <ListItemAvatar>
              <Avatar sx={t.data.total > 0 ? { bgcolor: green[500] } : { bgcolor: orange[500] }}>
                {t.data.total > 0 ? <MoveToInboxIcon /> : <OutboxIcon />}
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={Format.currency(t.data.total)} secondary={Format.date(t.date)} />
          </ListItem>
          <Divider variant="inset" component="li" />
        </>
      })}
    </List>
  );
}

export default TransactionLog;