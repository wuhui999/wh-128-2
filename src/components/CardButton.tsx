import { CardState } from '@/types/game';
import { getCardColorClass } from '@/utils/cards';
import { cn } from '@/lib/utils';

interface CardButtonProps {
  cardState: CardState;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
}

export default function CardButton({
  cardState,
  onClick,
  selected = false,
  disabled = false,
  size = 'md',
  showStatus = false,
}: CardButtonProps) {
  const { card, played, inHand } = cardState;
  const colorClass = getCardColorClass(card);

  const sizeClasses = {
    sm: 'w-10 h-14 text-sm',
    md: 'w-14 h-20 text-lg',
    lg: 'w-16 h-24 text-xl',
  };

  const baseClasses = cn(
    'relative rounded-lg border-2 font-bold flex items-center justify-center transition-all duration-150 select-none',
    sizeClasses[size],
    colorClass
  );

  if (played) {
    return (
      <div
        className={cn(
          baseClasses,
          'bg-gray-200 border-gray-300 opacity-40 line-through cursor-not-allowed'
        )}
        onClick={!disabled ? onClick : undefined}
      >
        <span className="transform rotate-12">{card.display}</span>
        {showStatus && (
          <span className="absolute top-1 right-1 text-xs text-gray-500">已出</span>
        )}
      </div>
    );
  }

  if (inHand) {
    return (
      <div
        className={cn(
          baseClasses,
          'bg-blue-50 border-blue-400 shadow-md',
          !disabled && 'cursor-pointer hover:bg-blue-100 hover:shadow-lg',
          selected && 'ring-2 ring-blue-500 ring-offset-2'
        )}
        onClick={!disabled ? onClick : undefined}
      >
        <span>{card.display}</span>
        {showStatus && (
          <span className="absolute top-1 right-1 text-xs text-blue-600">手牌</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        'bg-white border-gray-300 shadow-sm',
        !disabled && 'cursor-pointer hover:bg-gray-50 hover:border-blue-400 hover:shadow-md active:scale-95',
        selected && 'ring-2 ring-green-500 ring-offset-2 bg-green-50 border-green-400'
      )}
      onClick={!disabled ? onClick : undefined}
    >
      <span>{card.display}</span>
      {card.type === 'level' && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full text-[10px] flex items-center justify-center text-yellow-900 font-bold">
          级
        </span>
      )}
    </div>
  );
}
