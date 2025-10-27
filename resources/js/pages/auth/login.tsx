import { useForm, router, usePage } from '@inertiajs/react';
import { Mail, Lock } from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import AuthLayout from '@/layouts/auth-layout';
import AuthButton from '@/components/auth/auth-button';
import Recaptcha from '@/components/recaptcha';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';
import { Button } from '@/components/ui/button';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
    recaptcha_token?: string;
};

interface Business {
    id: number;
    name: string;
    slug: string;
    business_type: string;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    demoBusinesses?: Business[];
}

export default function Login({ status, canResetPassword, demoBusinesses = [] }: LoginProps) {
    const { t } = useTranslation();
    const [recaptchaToken, setRecaptchaToken] = useState<string>('');
    const { themeColor, customColor } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const { props } = usePage();
    const isSaas = (props as any).globalSettings?.is_saas;
    const isDemo = (props as any).globalSettings?.is_demo;
    console.log('isDemo:', isDemo); // Debugging line to check the value of isDemo

    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        // Set default credentials if in demo mode
        if (isDemo) {
            setData({
                email: isSaas ? 'company@example.com' : 'company@example.com',
                password: 'password',
                remember: false
            });
        }
    }, [isDemo]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const formData = { ...data, recaptcha_token: recaptchaToken };
        post(route('login'), formData, {
            onFinish: () => reset('password'),
        });
    };

    // No longer needed as we're using router.post directly in the button handlers

    const openBusinessInNewTab = (businessId: number, slug: string, e: React.MouseEvent) => {
        // Prevent the default form submission
        e.preventDefault();
        e.stopPropagation();

        // Use the same URL structure as in vcard-builder/index.tsx
        const url = route('public.vcard.show.direct', slug);
        window.open(url, '_blank');
    };

    return (
        <AuthLayout
            title={t("Log in to your account")}
            description={t("Enter your credentials to access your account")}
            status={status}
        >
            <form className="space-y-5" onSubmit={submit}>
                <div className="space-y-4">
                    <div className="relative">
                        <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium mb-1 block">{t("Email address")}</Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                id="email"
                                type="email"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="email@example.com"
                                className="pl-10 w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg transition-all duration-200"
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">{t("Password")}</Label>
                            {canResetPassword && (
                                <TextLink
                                    href={route('password.request')}
                                    className="text-sm transition-colors duration-200"
                                    style={{ color: primaryColor }}
                                    tabIndex={5}
                                >
                                    {t("Forgot password?")}
                                </TextLink>
                            )}
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                                className="pl-10 w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg transition-all duration-200"
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    <div className="flex items-center">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onClick={() => setData('remember', !data.remember)}
                            tabIndex={3}
                            className="border-gray-300 rounded"
                            style={{ '--tw-ring-color': primaryColor, color: primaryColor } as React.CSSProperties}
                        />
                        <Label htmlFor="remember" className="ml-2 text-gray-600 dark:text-gray-400">{t("Remember me")}</Label>
                    </div>
                </div>

                <Recaptcha
                    onVerify={setRecaptchaToken}
                    onExpired={() => setRecaptchaToken('')}
                    onError={() => setRecaptchaToken('')}
                />

                <AuthButton
                    tabIndex={4}
                    processing={processing}
                >
                    {t("Log in")}
                </AuthButton>

                {isDemo && (
                    <div className="mt-6">
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">Demo Quick Access</h3>

                            {isSaas ? (
                                // SaaS Demo Buttons
                                <div className="flex flex-col space-y-3">
                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                router.post(route('login'), {
                                                    email: 'superadmin@example.com',
                                                    password: 'password',
                                                    remember: false,
                                                    recaptcha_token: recaptchaToken
                                                });
                                            }}
                                            className="w-full sm:flex-1 text-white px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            Login as Super Admin
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                router.post(route('login'), {
                                                    email: 'company@example.com',
                                                    password: 'password',
                                                    remember: false,
                                                    recaptcha_token: recaptchaToken
                                                });
                                            }}
                                            className="w-full sm:flex-1 text-white px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            Login as Company
                                        </Button>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                router.post(route('login'), {
                                                    email: 'maggie93@example.com',
                                                    password: 'password',
                                                    remember: false,
                                                    recaptcha_token: recaptchaToken
                                                });
                                            }}
                                            className="w-full sm:flex-1 text-white px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            Login As HR
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                router.post(route('login'), {
                                                    email: 'qwaters@example.com',
                                                    password: 'password',
                                                    remember: false,
                                                    recaptcha_token: recaptchaToken
                                                });
                                            }}
                                            className="w-full sm:flex-1 text-white px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            Login As Employee
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                // Non-SaaS Demo Buttons
                                <div className="flex flex-col space-y-3">
                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                router.post(route('login'), {
                                                    email: 'company@example.com',
                                                    password: 'password',
                                                    remember: false,
                                                    recaptcha_token: recaptchaToken
                                                });
                                            }}
                                            className="w-full sm:flex-1 text-white px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            Login as Company
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                router.post(route('login'), {
                                                    email: 'hr@example.com',
                                                    password: 'password',
                                                    remember: false,
                                                    recaptcha_token: recaptchaToken
                                                });
                                            }}
                                            className="w-full sm:flex-1 text-white px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            Login As HR
                                        </Button>
                                    </div>

                                    <div className="flex justify-center">
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                router.post(route('login'), {
                                                    email: 'employee@example.com',
                                                    password: 'password',
                                                    remember: false,
                                                    recaptcha_token: recaptchaToken
                                                });
                                            }}
                                            className="w-full sm:flex-1 text-white px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            Login As Employee
                                        </Button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}

                {isSaas && (
                    <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
                        {t("Don't have an account?")}{' '}
                        <TextLink
                            href={route('register')}
                            className="font-medium transition-colors duration-200"
                            style={{ color: primaryColor }}
                            tabIndex={6}
                        >
                            {t("Sign up")}
                        </TextLink>
                    </div>
                )}
            </form>
        </AuthLayout>
    );
}