import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Euro, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useLanguage } from '@/components/LanguageProvider';

export default function PaymentsSection({ user }) {
  const { t } = useLanguage();
  const { data: payments, isLoading } = useQuery({
    queryKey: ['my-payments', user?.email],
    queryFn: () => base44.entities.Payment.filter({ client_email: user?.email }),
    enabled: !!user?.email,
    initialData: []
  });

  const pendingPayments = payments.filter(p => p.status !== 'paid');
  const totalDebt = pendingPayments.reduce((sum, p) => sum + (p.total || p.amount + (p.penalty || 0)), 0);
  const isBlocked = totalDebt > 30;

  const getStatusBadge = (status) => {
    const config = {
      pending: { labelKey: 'pending', class: 'bg-amber-100 text-amber-800', icon: Clock },
      paid: { labelKey: 'total_paid', class: 'bg-green-100 text-green-800', icon: CheckCircle },
      overdue: { labelKey: 'overdue', class: 'bg-red-100 text-red-800', icon: AlertTriangle },
      blocked: { labelKey: 'account_blocked', class: 'bg-red-100 text-red-800', icon: XCircle }
    };
    const { labelKey, class: className, icon: Icon } = config[status] || config.pending;
    const label = t(labelKey);
    return (
      <Badge className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Alert if blocked or high debt */}
      {isBlocked && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800 mb-1">⚠️ {t('account_blocked')}</h3>
              <p className="text-red-700 text-sm mb-2">
                {t('debt_warning')}
              </p>
              <div className="text-sm text-red-600">
                <strong>{t('active_restrictions')}:</strong>
                <ul className="list-disc ml-5 mt-1">
                  <li>{t('no_new_bookings')}</li>
                  <li>{t('no_classes')}</li>
                  <li>{t('no_competitions')}</li>
                  <li>{t('no_club_representation')}</li>
                </ul>
              </div>
              <p className="text-red-800 font-bold mt-3">
                {t('total_debt')}: {totalDebt.toFixed(2)}€
              </p>
            </div>
          </div>
        </div>
      )}

      {totalDebt > 0 && !isBlocked && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800">{t('pending_payments')}</h3>
              <p className="text-amber-700 text-sm mt-1">
                {t('regularize_warning')}
              </p>
              <p className="text-amber-800 font-semibold mt-2">
                {t('amount_owed')}: {totalDebt.toFixed(2)}€
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">{t('total_paid')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.total || p.amount), 0).toFixed(2)}€
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">{t('pending')}</p>
                <p className="text-2xl font-bold text-amber-600">
                  {totalDebt.toFixed(2)}€
                </p>
              </div>
              <Clock className="w-10 h-10 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">{t('penalties')}</p>
                <p className="text-2xl font-bold text-red-600">
                  {payments.reduce((sum, p) => sum + (p.penalty || 0), 0).toFixed(2)}€
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">{t('payment_history')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-stone-500">
              <Euro className="w-12 h-12 mx-auto mb-2 text-stone-300" />
              <p>{t('no_payments')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    payment.status === 'paid' ? 'bg-green-50 border-l-green-500' :
                    payment.status === 'overdue' ? 'bg-red-50 border-l-red-500' :
                    'bg-amber-50 border-l-amber-500'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[#2C3E1F]">
                          {t('monthly_fee')} {payment.month}
                        </span>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="text-sm text-stone-600 space-y-1">
                        <p>{t('due_date')}: {payment.due_date ? format(new Date(payment.due_date), "d 'de' MMMM", { locale: pt }) : 'N/A'}</p>
                        {payment.paid_at && (
                          <p className="text-green-600">
                            {t('paid_on')}: {format(new Date(payment.paid_at), "d 'de' MMMM", { locale: pt })}
                          </p>
                        )}
                        {payment.penalty > 0 && (
                          <p className="text-red-600 font-medium">
                            {t('penalty_applied')}: +{payment.penalty.toFixed(2)}€
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-stone-500">Total</p>
                      <p className="text-2xl font-bold text-[#4A5D23]">
                        {(payment.total || payment.amount + (payment.penalty || 0)).toFixed(2)}€
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Rules Info */}
      <Card className="border-0 shadow-md bg-stone-50">
        <CardHeader>
          <CardTitle className="text-lg">{t('payment_rules')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-stone-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Até dia 8:</strong> Sem penalização</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span><strong>Dia 9 a 15:</strong> Penalização de +5€</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span><strong>Dia 16 até fim do mês:</strong> Penalização de +15€</span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span><strong>Após fim do mês:</strong> Perda de horário</span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-700 flex-shrink-0 mt-0.5" />
              <span><strong>Dívida superior a 30€:</strong> Conta bloqueada (sem aulas, provas ou representação do clube)</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}