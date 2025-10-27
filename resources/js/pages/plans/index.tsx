import React, { useState, useEffect } from 'react';
import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { router, usePage } from '@inertiajs/react';
import {
  CheckCircle2,
  X,
  Pencil,
  Trash2,
  Globe,
  FileText,
  Bot,
  BarChart2,
  Mail,
  Box,
  Store,
  Users,
  HardDrive,
  Plus,
  Sparkles,
  Info,
  Crown,
  Zap,
  Clock,
  Banknote,
  CreditCard,
  IndianRupee,
  Wallet,
  Coins
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { useForm } from '@inertiajs/react';
import { toast } from '@/components/custom-toast';
import { PlanSubscriptionModal } from '@/components/plan-subscription-modal';

interface Plan {
  id: number;
  name: string;
  price: string | number;
  formatted_price?: string;
  duration: string;
  description: string;
  trial_days: number;
  features: string[];
  stats: {
    users: number | string;
    employees: number | string;
    storage: string;
  };
  status: boolean;
  recommended?: boolean;
  is_default?: boolean;
  is_current?: boolean;
  is_trial_available?: boolean;
}

interface Props {
  plans: Plan[];
  billingCycle: 'monthly' | 'yearly';
  hasDefaultPlan?: boolean;
  isAdmin?: boolean;
  currentPlan?: any;
  userTrialUsed?: boolean;
  paymentMethods?: any[];
  currency?: string;
  currencySymbol?: string;
}

export default function Plans({ plans: initialPlans, billingCycle: initialBillingCycle = 'monthly', hasDefaultPlan, isAdmin = false, currentPlan, userTrialUsed, paymentMethods = [], currency, currencySymbol }: Props) {
  const { t } = useTranslation();
  const { flash } = usePage().props as any;
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(initialBillingCycle);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const { post, processing } = useForm();


  // Helper function to safely format currency
  const formatCurrency = (amount: string | number) => {
    if (typeof window !== 'undefined' && window.appSettings?.formatCurrency) {
      // Use numeric value if available, otherwise parse the string
      const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount);
      return window.appSettings.formatCurrency(numericAmount, { showSymbol: true });
    }
    // Fallback if appSettings is not available
    return amount;
  };

   const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Plan') }
  ]

  // Update plans when initialPlans changes
  useEffect(() => {
    setPlans(initialPlans);
  }, [initialPlans]);


  // Function to handle billing cycle change
  const handleBillingCycleChange = (value: 'monthly' | 'yearly') => {
    setBillingCycle(value);
    router.get(route('plans.index'), { billing_cycle: value }, { preserveState: true });
  };

  // Company plan actions
  const handlePlanRequest = (planId: number) => {
    toast.loading(t('Submitting plan request...'));

    router.post(route('plans.request'), {
      plan_id: planId,
      billing_cycle: billingCycle
    }, {
      onSuccess: (page) => {
        toast.dismiss();
        if (page.props.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash?.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(t(errors));
        } else {
          toast.error(t('Failed to submit plan request: {{errors}}', { errors: Object.values(errors).join(', ') }));
        }
      }
    });
  };

  const handleStartTrial = (planId: number) => {
    toast.loading(t('Starting trial...'));

    router.post(route('plans.trial'), {
      plan_id: planId
    }, {
      onSuccess: (page) => {
        toast.dismiss();
        if (page.props.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash?.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(t(errors));
        } else {
          toast.error(t('Failed to start trial: {{errors}}', { errors: Object.values(errors).join(', ') }));
        }
      }
    });
  };

  const handleSubscribe = async (planId: number) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      try {
        const response = await fetch(route('payment.methods'));
        const paymentMethods = await response.json();
        setSelectedPlan({ ...plan, paymentMethods });
        setIsSubscriptionModalOpen(true);
      } catch (error) {
        toast.error(t('Failed to load payment methods'));
      }
    }
  };

  const formatPaymentMethods = (paymentSettings: any) => {
    const methods = [];

    if (paymentSettings?.is_bank_enabled === true || paymentSettings?.is_bank_enabled === '1') {
      methods.push({
        id: 'bank',
        name: t('Bank Transfer'),
        icon: <Banknote className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_stripe_enabled === true || paymentSettings?.is_stripe_enabled === '1') {
      methods.push({
        id: 'stripe',
        name: t('Stripe'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_paypal_enabled === true || paymentSettings?.is_paypal_enabled === '1') {
      methods.push({
        id: 'paypal',
        name: t('PayPal'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_razorpay_enabled === true || paymentSettings?.is_razorpay_enabled === '1') {
      methods.push({
        id: 'razorpay',
        name: t('Razorpay'),
        icon: <IndianRupee className="h-5 w-5" />,
        enabled: true
      });
    }

    if ((paymentSettings?.is_mercadopago_enabled === true || paymentSettings?.is_mercadopago_enabled === '1') && paymentSettings?.mercadopago_access_token) {
      methods.push({
        id: 'mercadopago',
        name: t('MercadoPago'),
        icon: <Wallet className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_paystack_enabled === true || paymentSettings?.is_paystack_enabled === '1') {
      methods.push({
        id: 'paystack',
        name: t('Paystack'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_flutterwave_enabled === true || paymentSettings?.is_flutterwave_enabled === '1') {
      methods.push({
        id: 'flutterwave',
        name: t('Flutterwave'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_paytabs_enabled === true || paymentSettings?.is_paytabs_enabled === '1') {
      methods.push({
        id: 'paytabs',
        name: t('PayTabs'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_skrill_enabled === true || paymentSettings?.is_skrill_enabled === '1') {
      methods.push({
        id: 'skrill',
        name: t('Skrill'),
        icon: <Wallet className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_coingate_enabled === true || paymentSettings?.is_coingate_enabled === '1') {
      methods.push({
        id: 'coingate',
        name: t('CoinGate'),
        icon: <Coins className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_payfast_enabled === true || paymentSettings?.is_payfast_enabled === '1') {
      methods.push({
        id: 'payfast',
        name: t('Payfast'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_tap_enabled === true || paymentSettings?.is_tap_enabled === '1') {
      methods.push({
        id: 'tap',
        name: t('Tap'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_xendit_enabled === true || paymentSettings?.is_xendit_enabled === '1') {
      methods.push({
        id: 'xendit',
        name: t('Xendit'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_paytr_enabled === true || paymentSettings?.is_paytr_enabled === '1') {
      methods.push({
        id: 'paytr',
        name: t('PayTR'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_mollie_enabled === true || paymentSettings?.is_mollie_enabled === '1') {
      methods.push({
        id: 'mollie',
        name: t('Mollie'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_toyyibpay_enabled === true || paymentSettings?.is_toyyibpay_enabled === '1') {
      methods.push({
        id: 'toyyibpay',
        name: t('toyyibPay'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_cashfree_enabled === true || paymentSettings?.is_cashfree_enabled === '1') {
      methods.push({
        id: 'cashfree',
        name: t('Cashfree'),
        icon: <IndianRupee className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_khalti_enabled === true || paymentSettings?.is_khalti_enabled === '1') {
      methods.push({
        id: 'khalti',
        name: t('Khalti'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_iyzipay_enabled === true || paymentSettings?.is_iyzipay_enabled === '1') {
      methods.push({
        id: 'iyzipay',
        name: t('Iyzipay'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_benefit_enabled === true || paymentSettings?.is_benefit_enabled === '1') {
      methods.push({
        id: 'benefit',
        name: t('Benefit'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_ozow_enabled === true || paymentSettings?.is_ozow_enabled === '1') {
      methods.push({
        id: 'ozow',
        name: t('Ozow'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_easebuzz_enabled === true || paymentSettings?.is_easebuzz_enabled === '1') {
      methods.push({
        id: 'easebuzz',
        name: t('Easebuzz'),
        icon: <IndianRupee className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_authorizenet_enabled === true || paymentSettings?.is_authorizenet_enabled === '1') {
      methods.push({
        id: 'authorizenet',
        name: t('AuthorizeNet'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_fedapay_enabled === true || paymentSettings?.is_fedapay_enabled === '1') {
      methods.push({
        id: 'fedapay',
        name: t('FedaPay'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_payhere_enabled === true || paymentSettings?.is_payhere_enabled === '1') {
      methods.push({
        id: 'payhere',
        name: t('PayHere'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_cinetpay_enabled === true || paymentSettings?.is_cinetpay_enabled === '1') {
      methods.push({
        id: 'cinetpay',
        name: t('CinetPay'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_paiement_enabled === true || paymentSettings?.is_paiement_enabled === '1') {
      methods.push({
        id: 'paiement',
        name: t('Paiement Pro'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_nepalste_enabled === true || paymentSettings?.is_nepalste_enabled === '1') {
      methods.push({
        id: 'nepalste',
        name: t('Nepalste'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_yookassa_enabled === true || paymentSettings?.is_yookassa_enabled === '1') {
      methods.push({
        id: 'yookassa',
        name: t('YooKassa'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_aamarpay_enabled === true || paymentSettings?.is_aamarpay_enabled === '1') {
      methods.push({
        id: 'aamarpay',
        name: t('Aamarpay'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_midtrans_enabled === true || paymentSettings?.is_midtrans_enabled === '1') {
      methods.push({
        id: 'midtrans',
        name: t('Midtrans'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_paymentwall_enabled === true || paymentSettings?.is_paymentwall_enabled === '1') {
      methods.push({
        id: 'paymentwall',
        name: t('PaymentWall'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    if (paymentSettings?.is_sspay_enabled === true || paymentSettings?.is_sspay_enabled === '1') {
      methods.push({
        id: 'sspay',
        name: t('SSPay'),
        icon: <CreditCard className="h-5 w-5" />,
        enabled: true
      });
    }

    return methods;
  };

  const getActionButton = (plan: Plan) => {
    // Check if user has active subscription to this plan
    if (currentPlan && currentPlan.id === plan.id && currentPlan.expires_at && new Date(currentPlan.expires_at) > new Date()) {
      return (
        <Button disabled className="w-full bg-green-100 text-green-800 border-green-200">
          <Crown className="h-4 w-4 mr-2" />
          {t('Already Subscribed')}
        </Button>
      );
    }

    if (plan.is_current) {
      return (
        <Button disabled className="w-full">
          <Crown className="h-4 w-4 mr-2" />
          {t('Current Plan')}
        </Button>
      );
    }

    if (plan.is_trial_available && !userTrialUsed) {
      return (
        <div className="space-y-2">
          <Button
            onClick={() => handleStartTrial(plan.id)}
            disabled={processing}
            variant="outline"
            className="w-full"
          >
            <Zap className="h-4 w-4 mr-2" />
            {t('Start {{days}} Day Trial', { days: plan.trial_days })}
          </Button>
          <Button
            onClick={() => handleSubscribe(plan.id)}
            disabled={processing}
            className="w-full"
          >
            {t('Subscribe Now')}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Button
          onClick={() => handlePlanRequest(plan.id)}
          disabled={processing}
          variant="outline"
          className="w-full"
        >
          <Clock className="h-4 w-4 mr-2" />
          {t('Request Plan')}
        </Button>
        <Button
          onClick={() => handleSubscribe(plan.id)}
          disabled={processing || (currentPlan && currentPlan.id === plan.id && currentPlan.expires_at && new Date(currentPlan.expires_at) > new Date())}
          className="w-full"
        >
          {currentPlan && currentPlan.id === plan.id && currentPlan.expires_at && new Date(currentPlan.expires_at) > new Date()
            ? t('Already Subscribed')
            : t('Subscribe Now')
          }
        </Button>
      </div>
    );
  };

  // Function to get the appropriate icon for a feature
  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'AI Integration':
        return <Bot className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  // Function to check if a feature is included in the plan
  const isFeatureIncluded = (plan: Plan, feature: string) => {
    return plan.features.includes(feature);
  };

  // Function to toggle plan status
  const togglePlanStatus = (planId: number) => {
    const plan = plans.find(p => p.id === planId);
    const newStatus = !plan?.status;
    toast.loading(`${newStatus ? t('Activating') : t('Deactivating')} plan...`);

    router.post(route('plans.toggle-status', planId), {}, {
      preserveState: true,
      onSuccess: (page) => {
        toast.dismiss();
        setPlans(plans.map(plan =>
          plan.id === planId ? { ...plan, status: !plan.status } : plan
        ));
        if (page.props.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash?.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(t(errors));
        } else {
          toast.error(t('Failed to update plan status: {{errors}}', { errors: Object.values(errors).join(', ') }));
        }
      }
    });
  };

  // Function to handle delete
  const handleDelete = (plan: Plan) => {
    setPlanToDelete(plan);
    setIsDeleteModalOpen(true);
  };

  // Function to handle delete confirmation
  const handleDeleteConfirm = () => {
    if (planToDelete) {
      toast.loading(t('Deleting plan...'));
      
      router.delete(route('plans.destroy', planToDelete.id), {
        onSuccess: (page) => {
          setIsDeleteModalOpen(false);
          setPlanToDelete(null);
          toast.dismiss();
          if (page.props.flash?.success) {
            toast.success(t(page.props.flash.success));
          } else if (page.props.flash?.error) {
            toast.error(t(page.props.flash.error));
          }
        },
        onError: (errors) => {
          toast.dismiss();
          if (typeof errors === 'string') {
            toast.error(t(errors));
          } else {
            toast.error(t('Failed to delete plan: {{errors}}', { errors: Object.values(errors).join(', ') }));
          }
        }
      });
    }
  };

  // Common features to display for all plans
  const commonFeatures = [
    'AI Integration'
  ];

  // Define stat icons
  const statIcons = {
    users: <Users className="h-5 w-5" />,
    employees: <Users className="h-5 w-5" />,
    storage: <HardDrive className="h-5 w-5" />
  };

  return (
    <PageTemplate
      title={t("Plans")}
      breadcrumbs={breadcrumbs}
      description={t("Manage subscription plans for your customers")}
      url="/plans"
    >
      <div className="space-y-8">
        {/* Header with controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {isAdmin ? t("Subscription Plans") : t("Choose Your Plan")}
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              {isAdmin
                ? t("Create and manage subscription plans to offer different service tiers to your customers.")
                : t("Select the perfect plan for your business needs")
              }
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Tabs
              value={billingCycle}
              onValueChange={(v) => handleBillingCycleChange(v as 'monthly' | 'yearly')}
              className="w-full sm:w-[400px]"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="monthly">{t("Monthly")}</TabsTrigger>
                <TabsTrigger value="yearly">
                  {t("Yearly")}
                  <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-200">
                    {t("Save 20%")}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {isAdmin && (
              <Button className="w-full sm:w-auto" onClick={() => router.get(route('plans.create'))}>
                <Plus className="h-4 w-4 mr-2" />
                {t("Add Plan")}
              </Button>
            )}
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`group relative h-full flex flex-col ${plan.recommended
                  ? 'z-10 scale-[1.02]'
                  : ''
                }`}
            >
              {/* Card with decorative elements */}
              <div className={`
                absolute inset-0 rounded-2xl 
                ${plan.recommended
                  ? 'bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary/30'
                  : 'bg-gradient-to-br from-gray-100/80 via-gray-50/50 to-transparent border-gray-200/80'
                } 
                border shadow-lg transition-all duration-300 
                group-hover:shadow-xl group-hover:shadow-primary/5
                overflow-hidden
              `}>
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full -mr-16 -mt-16 opacity-70"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/10 to-transparent rounded-full -ml-12 -mb-12 opacity-50"></div>
              </div>

              {/* Recommended indicator */}
              {plan.recommended && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center z-20">
                  <div className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 text-sm font-medium">
                    <Sparkles className="h-4 w-4" />
                    {t("Recommended")}
                  </div>
                </div>
              )}

              {/* Status indicator - Admin only */}
              {isAdmin && (
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  {plan.is_default && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {t("Default")}
                    </div>
                  )}
                  <div className={`
                    flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                    ${plan.status
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                    }
                  `}>
                    <span className={`
                      w-2 h-2 rounded-full 
                      ${plan.status ? 'bg-emerald-500' : 'bg-red-500'}
                    `}></span>
                    {plan.status ? t("Active") : t("Inactive")}
                  </div>
                </div>
              )}

              {/* Current plan indicator - Company only */}
              {!isAdmin && plan.is_current && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    <Crown className="h-3 w-3" />
                    {t("Current")}
                  </div>
                </div>
              )}

              {/* Content container */}
              <div className="relative z-10 flex flex-col h-full p-6 pt-8">
                {/* Plan header */}
                <div className="mb-6">
                  <h3 className={`
                    text-2xl font-bold mb-2 
                    ${plan.recommended ? 'text-primary' : ''}
                  `}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className={`
                      text-3xl font-extrabold 
                      ${plan.recommended ? 'text-primary' : ''}
                    `}>
                      {currencySymbol}{plan.price}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      /{t(plan.duration.toLowerCase())}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                    {plan.description}
                  </p>
                  {plan.trial_days > 0 && (
                    <div className="flex items-center gap-1.5 text-sm text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      {t("{{days}} days free trial", { days: plan.trial_days })}
                    </div>
                  )}
                </div>

                {/* Divider with icon */}
                <div className="relative flex items-center my-4">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <div className="mx-3 bg-primary/10 text-primary p-1.5 rounded-full">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                {/* Features */}
                <div className="mb-6 flex-1">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    {t("Features")}
                  </h4>
                  <ul className="space-y-2.5">
                    {commonFeatures.map((feature, index) => {
                      const included = isFeatureIncluded(plan, feature);

                      return (
                        <li key={index} className="flex items-center gap-3">
                          {included ? (
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                              <X className="h-3.5 w-3.5" />
                            </div>
                          )}
                          <span className={`text-sm ${included ? 'font-medium' : 'text-muted-foreground'}`}>
                            {t(feature)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Usage limits */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    {t("Usage Limits")}
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200 p-3 group-hover:border-primary/30 transition-colors">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-70"></div>
                      <div className="relative flex items-center gap-2 mb-1">
                        <div className="p-1.5 rounded-full bg-emerald-100 text-emerald-600">
                          {statIcons.users}
                        </div>
                        <div className="text-xl font-bold text-emerald-700">
                          {plan.stats.users}
                        </div>
                      </div>
                      <div className="relative text-xs font-medium text-emerald-600 uppercase tracking-wide">
                        {t("Users")}
                      </div>
                    </div>
                    <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200 p-3 group-hover:border-primary/30 transition-colors">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-70"></div>
                      <div className="relative flex items-center gap-2 mb-1">
                        <div className="p-1.5 rounded-full bg-blue-100 text-blue-600">
                          {statIcons.employees}
                        </div>
                        <div className="text-xl font-bold text-blue-700">
                          {plan.stats.employees}
                        </div>
                      </div>
                      <div className="relative text-xs font-medium text-blue-600 uppercase tracking-wide">
                        {t("Employees")}
                      </div>
                    </div>
                    <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200 p-3 group-hover:border-primary/30 transition-colors">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-70"></div>
                      <div className="relative flex items-center gap-2 mb-1">
                        <div className="p-1.5 rounded-full bg-amber-100 text-amber-600">
                          {statIcons.storage}
                        </div>
                        <div className="text-xl font-bold text-amber-700">
                          {plan.stats.storage}
                        </div>
                      </div>
                      <div className="relative text-xs font-medium text-amber-600 uppercase tracking-wide">
                        {t("Storage")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-auto pt-4 border-t border-gray-200">
                  {isAdmin ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={plan.status}
                          onCheckedChange={() => togglePlanStatus(plan.id)}
                          className={plan.status ? "data-[state=checked]:bg-primary" : ""}
                        />
                        <span className="text-sm text-muted-foreground">
                          {plan.status ? t("Active") : t("Inactive")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-9 p-0 border-gray-200 hover:border-primary hover:text-primary"
                          title={t("Edit")}
                          onClick={() => router.get(route('plans.edit', plan.id))}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {!plan.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0 border-gray-200 hover:border-red-400 hover:text-red-600"
                            title={t("Delete")}
                            onClick={() => handleDelete(plan)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    getActionButton(plan)
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Delete Modal - Admin only */}
        {isAdmin && (
          <CrudDeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteConfirm}
            itemName={planToDelete?.name || ''}
            entityName="plan"
          />
        )}

        {/* Subscription Modal - Company only */}
        {!isAdmin && selectedPlan && (
          <PlanSubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => {
              setIsSubscriptionModalOpen(false);
              setSelectedPlan(null);
            }}
            plan={selectedPlan}
            billingCycle={billingCycle}
            paymentMethods={formatPaymentMethods(selectedPlan.paymentMethods)}
            currencySymbol={currencySymbol}
          />
        )}
      </div>
    </PageTemplate>
  );
}