import { LeadHistory } from '@/types';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  FileText, 
  UserCheck, 
  UserPlus, 
  Star, 
  Clock,
  MessageSquare,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

interface LeadHistoryTimelineProps {
  history: LeadHistory[];
  isLoading?: boolean;
}

export function LeadHistoryTimeline({ history, isLoading }: LeadHistoryTimelineProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse flex items-center gap-2 text-gray-400">
          <Clock className="h-4 w-4" />
          <span>Loading history...</span>
        </div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-lg">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No history available</p>
      </div>
    );
  }

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'StatusChanged':
        return RefreshCw;
      case 'NoteAdded':
        return MessageSquare;
      case 'AssignmentChanged':
        return UserCheck;
      case 'DetailsAdded':
        return FileText;
      case 'ConvertedToCustomer':
        return CheckCircle;
      case 'RatingChanged':
        return Star;
      default:
        return Clock;
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'StatusChanged':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'NoteAdded':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'AssignmentChanged':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'DetailsAdded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'ConvertedToCustomer':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'RatingChanged':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatChangeDescription = (event: LeadHistory) => {
    switch (event.changeType) {
      case 'StatusChanged':
        return (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-500 line-through text-sm">{event.oldValue}</span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-blue-600">{event.newValue}</span>
          </div>
        );
      case 'AssignmentChanged':
        return (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-gray-600">Assigned to</span>
            <span className="font-medium text-purple-600">{event.newValue}</span>
          </div>
        );
      case 'RatingChanged':
        return (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-gray-600">Rating changed to</span>
            <span className="font-medium text-amber-600">{event.newValue}</span>
            <Star className="h-3 w-3 text-amber-500 fill-current" />
          </div>
        );
      case 'ConvertedToCustomer':
        return (
          <div className="flex items-center gap-1 text-emerald-600">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Converted to customer</span>
          </div>
        );
      default:
        return event.description ? (
          <p className="text-gray-700 text-sm">{event.description}</p>
        ) : null;
    }
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {history.map((event, index) => {
          const Icon = getChangeTypeIcon(event.changeType);
          const isLast = index === history.length - 1;
          
          return (
            <li key={event.historyId}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gradient-to-b from-gray-200 to-gray-100"
                    aria-hidden="true"
                  />
                )}
                
                <div className="relative flex items-start space-x-3">
                  {/* Timeline icon */}
                  <div className="relative">
                    <div className={`
                      h-10 w-10 rounded-full border-2 flex items-center justify-center
                      ${getChangeTypeColor(event.changeType)}
                    `}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Content card */}
                  <Card className="flex-1 min-w-0 p-4 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getChangeTypeColor(event.changeType)}>
                          {event.changeType}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          by {event.changedByUserName}
                        </span>
                      </div>
                      <time className="text-sm text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(event.changedAt), 'MMM d, yyyy • h:mm a')}
                      </time>
                    </div>

                    <div className="mt-2">
                      {formatChangeDescription(event)}
                    </div>

                    {/* Show full note/details content if available */}
                    {(event.changeType === 'NoteAdded' || event.changeType === 'DetailsAdded') && 
                      event.description && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {event.description}
                        </p>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}