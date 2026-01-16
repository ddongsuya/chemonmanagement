'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, User, Phone, Mail, FileText, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Customer } from '@/types';

interface CustomerCardProps {
  customer: Customer;
}

export default function CustomerCard({ customer }: CustomerCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {customer.company_name}
              </h3>
              {customer.business_number && (
                <p className="text-sm text-gray-500">
                  {customer.business_number}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4" />
            <span>{customer.contact_person}</span>
          </div>
          {customer.contact_phone && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{customer.contact_phone}</span>
            </div>
          )}
          {customer.contact_email && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{customer.contact_email}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-4 border-t">
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              견적 {customer.quotation_count}건
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {formatCurrency(customer.total_amount)}
          </Badge>
        </div>

        <div className="mt-4">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href={`/customers/${customer.id}`}>
              상세보기 <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
