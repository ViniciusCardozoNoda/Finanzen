
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';

type ViewMode = 'login' | 'register' | 'forgotPassword' | 'resetPassword';

const Login: React.FC = () => {
  const [email, setEmail] = useState('user@finanzen.app');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const { login, register, users, resetPassword } = useAuth();
  const { t } = useLocalization();
  
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [isGoogleLoginOpen, setIsGoogleLoginOpen] = useState(false);
  const [isFacebookLoginOpen, setIsFacebookLoginOpen] = useState(false);

  // Registration form state
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [regError, setRegError] = useState('');

  // Forgot/Reset Password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetPasswordForm, setResetPasswordForm] = useState({ newPassword: '', confirmNewPassword: '' });
  const [resetError, setResetError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(email, password)) {
      setLoginError(t('invalid_credentials_error'));
    } else {
      setLoginError('');
    }
  };

  const processGoogleLogin = async (email: string, name: string) => {
    const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (userExists) {
        login(email);
    } else {
        const registrationResult = await register(name, email, undefined, true);
        if (!registrationResult.success) {
            setLoginError(t(registrationResult.messageKey));
        }
    }
    setIsGoogleLoginOpen(false);
  };

  const processFacebookLogin = async (email: string, name: string) => {
    const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (userExists) {
        login(email);
    } else {
        const registrationResult = await register(name, email, undefined, true);
        if (!registrationResult.success) {
            setLoginError(t(registrationResult.messageKey));
        }
    }
    setIsFacebookLoginOpen(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (regForm.password !== regForm.confirmPassword) {
      setRegError(t('passwords_do_not_match'));
      return;
    }

    const result = await register(regForm.name, regForm.email, regForm.password);
    if (result.success) {
      setLoginMessage(t(result.messageKey));
      setViewMode('login');
      setRegForm({ name: '', email: '', password: '', confirmPassword: '' });
      setEmail(regForm.email);
    } else {
      setRegError(t(result.messageKey));
    }
  };

  const handleFindAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    const userExists = users.some(u => u.email.toLowerCase() === resetEmail.toLowerCase());
    if (userExists) {
      setViewMode('resetPassword');
    } else {
      setResetError(t('account_not_found'));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmNewPassword) {
      setResetError(t('passwords_do_not_match'));
      return;
    }
    const result = await resetPassword(resetEmail, resetPasswordForm.newPassword);
    if (result.success) {
      setLoginMessage(t(result.messageKey));
      setViewMode('login');
      setResetEmail('');
      setResetPasswordForm({ newPassword: '', confirmNewPassword: '' });
    } else {
      setResetError(t(result.messageKey));
    }
  };
  
  const handleRegInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegForm(prev => ({ ...prev, [name]: value }));
  };
  
  const mockGoogleUsers = [
    { name: 'Maria Silva', email: 'maria.silva@gmail.com', avatar: `https://i.pravatar.cc/150?u=maria` },
    { name: 'João Pereira', email: 'joao.pereira@outlook.com', avatar: `https://i.pravatar.cc/150?u=joao` }
  ];

  const mockFacebookUsers = [
    { name: 'Ana Souza', email: 'ana.souza@facebook.user', avatar: `https://i.pravatar.cc/150?u=ana` },
  ];

  const GoogleLoginModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm m-4">
            <div className="p-6 text-center border-b border-slate-200">
                <i className="fab fa-google text-2xl text-red-500 mb-2"></i>
                <h3 className="text-xl font-semibold text-slate-800">{t('google_signin_title')}</h3>
                <p className="text-sm text-slate-500 mt-1">{t('google_signin_to_continue')}</p>
            </div>
            <div className="p-4">
                <p className="text-sm font-medium text-slate-600 px-2 pb-2">{t('google_signin_choose_account')}</p>
                <ul className="space-y-1">
                    {mockGoogleUsers.map(gUser => (
                        <li key={gUser.email}>
                            <button 
                                onClick={() => processGoogleLogin(gUser.email, gUser.name)}
                                className="w-full flex items-center text-left p-2 rounded-lg hover:bg-slate-100"
                            >
                                <img src={gUser.avatar} alt="avatar" className="w-10 h-10 rounded-full" />
                                <div className="ml-3">
                                    <p className="font-semibold text-sm text-slate-800">{gUser.name}</p>
                                    <p className="text-xs text-slate-500">{gUser.email}</p>
                                </div>
                            </button>
                        </li>
                    ))}
                    <li>
                         <button className="w-full flex items-center text-left p-2 rounded-lg hover:bg-slate-100 text-slate-600">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100">
                                <i className="fas fa-user-plus"></i>
                            </div>
                            <div className="ml-3">
                                <p className="font-semibold text-sm">{t('google_signin_another_account')}</p>
                            </div>
                        </button>
                    </li>
                </ul>
            </div>
             <div className="p-4 bg-slate-50 rounded-b-lg">
                <button 
                    onClick={() => setIsGoogleLoginOpen(false)} 
                    className="w-full text-sm text-slate-600 hover:text-slate-800 font-medium py-2"
                >
                    {t('cancel')}
                </button>
            </div>
        </div>
    </div>
  );

  const FacebookLoginModal = () => {
    const fbUser = mockFacebookUsers[0];
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm m-4 text-center">
                <div className="p-6">
                    <i className="fab fa-facebook-square text-5xl text-blue-600 mb-4"></i>
                    <p className="text-lg font-semibold text-slate-800 mb-2">{t('facebook_signin_continue_as', { name: fbUser.name })}</p>
                    <p className="text-sm text-slate-500 mb-6">{t('facebook_signin_permission_notice')}</p>
                    <img src={fbUser.avatar} alt="avatar" className="w-16 h-16 rounded-full mx-auto mb-1" />
                    <p className="font-semibold text-slate-700">{fbUser.name}</p>
                    <p className="text-xs text-slate-500">{fbUser.email}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-b-lg border-t border-slate-200">
                    <button 
                        onClick={() => processFacebookLogin(fbUser.email, fbUser.name)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                    >
                        {t('facebook_signin_continue_as_button', { name: fbUser.name.split(' ')[0] })}
                    </button>
                    <button 
                        onClick={() => setIsFacebookLoginOpen(false)} 
                        className="w-full text-sm text-slate-600 hover:text-slate-800 font-medium py-2 mt-2"
                    >
                        {t('cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
  };

  if (viewMode === 'register') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-full max-w-md p-8 space-y-6 bg-white border border-slate-200 rounded-2xl shadow-lg animate-fade-in">
          <div className="text-center">
              <div className="flex justify-center mb-4">
                   <div className="p-4 bg-emerald-500 rounded-full">
                      <i className="fas fa-user-plus text-5xl text-white"></i>
                   </div>
              </div>
            <h2 className="mt-6 text-3xl font-extrabold text-slate-800">{t('register_title')}</h2>
          </div>
          <form className="space-y-4" onSubmit={handleRegister}>
            <div>
                <label htmlFor="full-name" className="sr-only">{t('full_name')}</label>
                <input id="full-name" name="name" type="text" required value={regForm.name} onChange={handleRegInputChange} className="appearance-none rounded-md relative block w-full px-4 py-3 border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder={t('full_name')} />
            </div>
            <div>
                <label htmlFor="email-address-reg" className="sr-only">{t('email')}</label>
                <input id="email-address-reg" name="email" type="email" autoComplete="email" required value={regForm.email} onChange={handleRegInputChange} className="appearance-none rounded-md relative block w-full px-4 py-3 border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder={t('email')} />
            </div>
            <div>
                <label htmlFor="password" className="sr-only">{t('password')}</label>
                <input id="password" name="password" type="password" required value={regForm.password} onChange={handleRegInputChange} className="appearance-none rounded-md relative block w-full px-4 py-3 border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder={t('password')} />
            </div>
            <div>
                <label htmlFor="confirm-password" className="sr-only">{t('confirm_password')}</label>
                <input id="confirm-password" name="confirmPassword" type="password" required value={regForm.confirmPassword} onChange={handleRegInputChange} className="appearance-none rounded-md relative block w-full px-4 py-3 border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder={t('confirm_password')} />
            </div>
            {regError && <p className="text-red-500 text-sm text-center">{regError}</p>}
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all"
              >
                {t('register')}
              </button>
            </div>
          </form>

          <div className="text-sm text-center text-slate-500">
            <button
              type="button"
              onClick={() => setViewMode('login')}
              className="font-medium text-emerald-600 hover:text-emerald-500 bg-transparent border-none p-0 cursor-pointer"
            >
              {t('back_to_login')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'forgotPassword') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-full max-w-md p-8 space-y-6 bg-white border border-slate-200 rounded-2xl shadow-lg animate-fade-in">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-emerald-500 rounded-full">
                <i className="fas fa-key text-5xl text-white"></i>
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-slate-800">{t('reset_password_title')}</h2>
            <p className="mt-2 text-sm text-slate-500">{t('reset_password_instructions')}</p>
          </div>
          <form className="space-y-4" onSubmit={handleFindAccount}>
            <div>
              <label htmlFor="email-address-reset" className="sr-only">{t('email')}</label>
              <input 
                id="email-address-reset" 
                name="email" 
                type="email" 
                autoComplete="email" 
                required 
                value={resetEmail} 
                onChange={(e) => setResetEmail(e.target.value)} 
                className="appearance-none rounded-md relative block w-full px-4 py-3 border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" 
                placeholder={t('email')} 
              />
            </div>
             {resetError && <p className="text-red-500 text-sm text-center">{resetError}</p>}
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all"
              >
                {t('send_reset_link')}
              </button>
            </div>
          </form>
          <div className="text-sm text-center text-slate-500">
            <button
              type="button"
              onClick={() => setViewMode('login')}
              className="font-medium text-emerald-600 hover:text-emerald-500 bg-transparent border-none p-0 cursor-pointer"
            >
              {t('back_to_login')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'resetPassword') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-full max-w-md p-8 space-y-6 bg-white border border-slate-200 rounded-2xl shadow-lg animate-fade-in">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-slate-800">{t('set_new_password')}</h2>
          </div>
          <form className="space-y-4" onSubmit={handleResetPassword}>
            <div>
              <label htmlFor="new-password" className="sr-only">{t('new_password')}</label>
              <input id="new-password" name="newPassword" type="password" required value={resetPasswordForm.newPassword} onChange={(e) => setResetPasswordForm(p => ({...p, newPassword: e.target.value}))} className="appearance-none rounded-md relative block w-full px-4 py-3 border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm" placeholder={t('new_password')} />
            </div>
            <div>
              <label htmlFor="confirm-new-password" className="sr-only">{t('confirm_new_password')}</label>
              <input id="confirm-new-password" name="confirmNewPassword" type="password" required value={resetPasswordForm.confirmNewPassword} onChange={(e) => setResetPasswordForm(p => ({...p, confirmNewPassword: e.target.value}))} className="appearance-none rounded-md relative block w-full px-4 py-3 border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm" placeholder={t('confirm_new_password')} />
            </div>
            {resetError && <p className="text-red-500 text-sm text-center">{resetError}</p>}
            <div>
              <button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all">
                {t('save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      {isGoogleLoginOpen && <GoogleLoginModal />}
      {isFacebookLoginOpen && <FacebookLoginModal />}
      <div className="w-full max-w-md p-8 space-y-6 bg-white border border-slate-200 rounded-2xl shadow-lg animate-fade-in">
        <div className="text-center">
            <div className="flex justify-center mb-4">
                 <div className="p-4 bg-emerald-500 rounded-full">
                    <i className="fas fa-wallet text-5xl text-white"></i>
                 </div>
            </div>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-800">{t('login_main_title')}</h2>
          <p className="mt-2 text-sm text-slate-500">{t('login_subtitle')}</p>
        </div>
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email-address" className="sr-only">{t('email')}</label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-md relative block w-full px-4 py-3 border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              placeholder={t('email')}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setLoginError('');
                setLoginMessage('');
              }}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="sr-only">{t('password')}</label>
            <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-md relative block w-full px-4 py-3 border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder={t('password')}
                value={password}
                onChange={(e) => {
                setPassword(e.target.value);
                setLoginError('');
                setLoginMessage('');
                }}
            />
          </div>

          <div className="text-right text-sm">
            <button
              type="button"
              onClick={() => setViewMode('forgotPassword')}
              className="font-medium text-emerald-600 hover:text-emerald-500"
            >
              {t('forgot_password')}
            </button>
          </div>
          
          {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
          {loginMessage && <p className="text-green-600 text-sm text-center">{loginMessage}</p>}


          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all"
            >
              {t('login')}
            </button>
          </div>
        </form>

        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-500">{t('or_sign_in_with')}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
                type="button"
                onClick={() => setIsGoogleLoginOpen(true)}
                className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white py-2 px-4 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
            >
                <i className="fab fa-google text-lg mr-2 text-red-500"></i>
                Google
            </button>
            <button
                type="button"
                onClick={() => setIsFacebookLoginOpen(true)}
                className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white py-2 px-4 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
            >
                <i className="fab fa-facebook text-lg mr-2 text-blue-600"></i>
                Facebook
            </button>
        </div>

        <div className="text-sm text-center text-slate-500">
          {t('dont_have_account')}{' '}
          <button
            type="button"
            onClick={() => setViewMode('register')}
            className="font-medium text-emerald-600 hover:text-emerald-500 bg-transparent border-none p-0 cursor-pointer"
          >
            {t('create_account')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
