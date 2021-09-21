import { LOCAL_USER_STORAGE, USER_SESSION } from "./constants";

interface IUser {
  pass: string;
  email: string;
  firstName: string;
  lastName: string;
  type: string;
}

interface ISession {
  userEmail: string;
  firstName: string;
  lastName: string;
  userType: string;
  loggedIn: Date;
}

class SessionService {

  get usrStore() {
    const users: IUser[] = JSON.parse(localStorage.getItem(LOCAL_USER_STORAGE) || '[]');
    if (!users.length) {
      const testUsers: IUser[] = [{
        email: 'john-natural@mail.com',
        pass: '12345678',
        firstName: 'John',
        lastName: 'Natural',
        type: 'natural'
      },
      {
        email: 'john-legal@mail.com',
        pass: '12345678',
        firstName: 'John',
        lastName: 'Legal',
        type: 'legal'
      }]

      localStorage.setItem(LOCAL_USER_STORAGE, JSON.stringify(testUsers));
      users.concat(testUsers);
    }

    const userStore = {
      get: (email: string): IUser | null => {
        return users.find(u => u.email === email) || null;
      },
      add: (user: IUser) => {
        users.push(user);
        localStorage.setItem(LOCAL_USER_STORAGE, JSON.stringify(users));
      }
    }

    return userStore;
  }

  get usrSession() {
    const sessionJson = sessionStorage.getItem(USER_SESSION);

    if (!sessionJson) return null;

    const session: ISession = JSON.parse(sessionJson || '{}');

    return session;
  }

  SignIn = (email: string, pass: string): IUser | null => {

    if (this.usrSession) throw new Error('There is already an active session');

    const user = this.usrStore.get(email);

    if (!user) return null;

    if (user.pass !== pass) return null;

    // Start new session
    sessionStorage.setItem(USER_SESSION, JSON.stringify({
      userEmail: email,
      userType: user.type,
      loggedIn: new Date(),
      lastName: user.lastName,
      firstName: user.firstName,
    } as ISession));

    return user;
  }

  SignOut = () => {
    sessionStorage.removeItem(USER_SESSION);
    window.location.pathname = '/signin';
  }
}

export default SessionService;