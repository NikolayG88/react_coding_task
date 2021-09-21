import SessionService from '../../../services/session/session-service';
import CashingService from '../../../services/cashing/cashing-service';
import Format from '../../../services/utility/format';

import { Switch, Route, useRouteMatch } from 'react-router-dom';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import IosShareIcon from '@mui/icons-material/IosShare';
import ListAltIcon from '@mui/icons-material/ListAlt';
import InputIcon from '@mui/icons-material/Input';

import MiniDrawerNav from './mini-drawer-nav';
import CashOut from '../cashing/cashout';
import CashIn from '../cashing/cashin';
import { useEffect, useState } from 'react';
import TransactionLog from '../cashing/transaction-log';

const AppLayout = (props: any) => {

  const sessionService = new SessionService();
  const cashingService = new CashingService();
  const { usrSession } = sessionService;
  const [userBallance, setUserBallance] = useState<string | undefined>();

  useEffect(() => {
    cashingService.getUserBallance(usrSession?.userEmail || '').then(ballance => {
      setUserBallance(Format.currency(ballance));
    });
  });

  cashingService.subscribeToUpdateEvents(async () => {
    const ballance = await cashingService.getUserBallance(usrSession?.userEmail || '');
    setUserBallance(Format.currency(ballance));
  });

  let { path, url } = useRouteMatch();
  const navProps = {
    titleLeft: `${usrSession?.firstName} ${usrSession?.lastName}`,
    titleRight: `Ballance: ${userBallance}`,
    navItems:
      [{ title: 'Cash In', icon: <InputIcon />, link: `${url}/cash-in` },
      { title: 'Cash Out', icon: <IosShareIcon />, link: `${url}/cash-out` },
      { title: 'Transaction Log', icon: <ListAltIcon />, link: `${url}/transaction-log` },
      {
        title: 'Sign Out', icon: <MeetingRoomIcon />, link: '#',
        action: () => {
          sessionService?.SignOut();
        }
      }]
  }
  return (
    <div>
      <MiniDrawerNav {...navProps}>
        <Switch>
          <Route exact path={path}>
            <h3>Welcome to our service endpoint.</h3>
            <ul>
              <li>
                <h4>Please select proceeding action.</h4>
              </li>
            </ul>
          </Route>
          <Route path={`${path}/cash-in/`}>
            <CashIn />
          </Route>
          <Route path={`${path}/cash-out/`}>
            <CashOut />
          </Route>
          <Route path={`${path}/transaction-log`}>
            <TransactionLog></TransactionLog>
          </Route>
        </Switch>
      </MiniDrawerNav>
    </div>
  );
}

export default AppLayout;