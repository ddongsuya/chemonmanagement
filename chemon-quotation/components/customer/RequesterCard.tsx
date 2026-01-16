'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Phone,
  Mail,
  Building2,
  Briefcase,
  Edit,
  Trash2,
  Star,
} from 'lucide-react';
import { Requester } from '@/types/customer';

interface RequesterCardProps {
  requester: Requester;
  onEdit: (requester: Requester) => void;
  onDelete: (requester: Requester) => void;
}

export default function RequesterCard({
  requester,
  onEdit,
  onDelete,
}: RequesterCardProps) {
  return (
    <Card
      className={`hover:shadow-md transition-shadow ${
        !requester.is_active ? 'opacity-60' : ''
      }`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{requester.name}</h3>
                {requester.is_primary && (
                  <Badge variant="default" className="text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    주담당
                  </Badge>
                )}
                {!requester.is_active && (
                  <Badge variant="secondary" className="text-xs">
                    비활성
                  </Badge>
                )}
              </div>
              {requester.position && (
                <p className="text-sm text-gray-500">{requester.position}</p>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(requester)}
              disabled={!requester.is_active}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => onDelete(requester)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {requester.department && (
            <div className="flex items-center gap-2 text-gray-600">
              <Building2 className="w-4 h-4" />
              <span>{requester.department}</span>
            </div>
          )}
          {requester.position && (
            <div className="flex items-center gap-2 text-gray-600">
              <Briefcase className="w-4 h-4" />
              <span>{requester.position}</span>
            </div>
          )}
          {requester.phone && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{requester.phone}</span>
            </div>
          )}
          {requester.email && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{requester.email}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
