import './App.css';

import {
  BrowserRouter as Router,
  Switch,
  Route,
  useHistory
} from "react-router-dom";
import AppLayout from './components/app-components/app-layout/app-layout';
import SignIn from './components/app-components/signin';
import SessionService from './services/session/session-service';
import { useEffect } from 'react';

function App() {

  const sessionService = new SessionService();
  useEffect(() => {
    if (!sessionService.usrSession
      && window.location.pathname !== '/signin')
      window.location.pathname = '/signin';
  }, []);


  return (
    <Router>
      <div>
        <Switch>
          <Route path="/signin">
            <SignIn />
          </Route>
          <Route path="/cashing">
            <AppLayout />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}


export default App;
