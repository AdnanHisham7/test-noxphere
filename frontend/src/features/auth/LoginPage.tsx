// src/features/auth/LoginPage.tsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { useLoginMutation } from '../../store/api/authApi';
import { setCredentials } from '../../store/slices/authSlice';
import { setActiveFranchise } from '../../store/slices/uiSlice';
import { RootState } from '../../store';
import { Button, Input } from '../../components/ui';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);
  const [login, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: LoginForm) => {
    try {
      const result = await login(data).unwrap();
      dispatch(
        setCredentials({
          user: result.data.user,
          tokens: {
            accessToken: result.data.tokens.accessToken,
            refreshToken: result.data.tokens.refreshToken,
          },
        })
      );
      // Auto-select this user's franchise (their first/default one) as the
      // active franchise for this session, so the top bar and every
      // franchise-scoped page immediately reflect it without extra clicks.
      if (result.data.user.franchiseId) {
        dispatch(setActiveFranchise(result.data.user.franchiseId));
      }
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-pitch-950 flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
        {/* Background tactical lines */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(204,255,0,0.3) 60px, rgba(204,255,0,0.3) 61px),
                repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(204,255,0,0.3) 60px, rgba(204,255,0,0.3) 61px)
              `,
            }}
          />
          {/* Volt radial glow */}
          <div className="absolute inset-0 bg-volt-glow opacity-30" />
        </div>

        {/* Diagonal accent bar */}
        <div
          className="absolute left-0 top-0 w-1 h-full bg-volt-400"
          style={{ boxShadow: '0 0 40px rgba(204,255,0,0.6)' }}
        />

        {/* Top logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 bg-volt-400 flex items-center justify-center"
              style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
            >
              <span className="font-display font-900 text-pitch-900 text-base">FC</span>
            </div>
            <div>
              <p className="font-display font-900 text-white uppercase text-xl tracking-widest">Football</p>
              <p className="font-display font-400 text-volt-400 uppercase text-xs tracking-[0.4em]">Franchise Platform</p>
            </div>
          </div>
        </div>

        {/* Center stats display */}
        <div className="relative z-10 space-y-6">
          <div>
            <p className="font-display font-900 text-white text-5xl uppercase leading-none tracking-tight">
              Manage Your<br />
              <span className="text-volt-400">Franchise.</span><br />
              Elevate Your<br />
              <span className="text-ice-400">Game.</span>
            </p>
          </div>

          <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
            A unified platform for attendance, performance tracking, fees, team coordination, and the Transfer Wall — all in one tactical dashboard.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {['Real-time Attendance', 'Performance Cards', 'Transfer Wall', 'Fee Management', 'Selection Tracking'].map((f) => (
              <span key={f} className="pill-gray text-2xs">{f}</span>
            ))}
          </div>
        </div>

        {/* Bottom stat bar */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { val: '5', label: 'User Roles' },
            { val: '∞', label: 'Players Tracked' },
            { val: '100%', label: 'Offline Support' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display font-900 text-2xl text-volt-400">{s.val}</p>
              <p className="text-2xs text-slate-600 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-8 h-8 bg-volt-400 rounded flex items-center justify-center">
              <span className="font-display font-900 text-pitch-900 text-sm">FC</span>
            </div>
            <p className="font-display font-extrabold text-white uppercase tracking-widest">Football Franchise</p>
          </div>

          {/* Header */}
          <div>
            <p className="section-title mb-2">Access Portal</p>
            <h1 className="font-display font-extrabold text-white text-3xl uppercase tracking-tight">Sign In</h1>
            <p className="text-slate-500 text-sm mt-1">Enter your credentials to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="coach@footballfranchise.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-end">
              <button type="button" className="text-xs text-volt-400 hover:underline">
                Forgot password?
              </button>
            </div>

            <Button type="submit" loading={isLoading} className="w-full py-3">
              Sign In
            </Button>
          </form>

          {/* Role indicators */}
          <div className="pt-4 border-t border-white/5">
            <p className="text-2xs text-slate-600 uppercase tracking-widest mb-3">Available Roles</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: 'Super Admin', color: 'text-volt-400' },
                { role: 'Manager', color: 'text-ice-400' },
                { role: 'Coach', color: 'text-field-400' },
                { role: 'Guardian', color: 'text-ember-400' },
              ].map((r) => (
                <div key={r.role} className="flex items-center gap-2 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full bg-current ${r.color}`} />
                  <span className="text-slate-500">{r.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transfer Wall public link */}
          <div className="text-center">
            <a
              href="/transfer-wall"
              className="text-xs text-ice-400 hover:underline"
            >
              View Public Transfer Wall →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
