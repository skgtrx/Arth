import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface EntityListProps<T> {
  items: T[];
  getId: (item: T) => number;
  getName: (item: T) => string;
  getIsActive: (item: T) => boolean;
  getSubtitle?: (item: T) => string | undefined;
  onEdit: (item: T) => void;
  onAdd: () => void;
  addLabel: string;
}

export default function EntityList<T>({
  items,
  getId,
  getName,
  getIsActive,
  getSubtitle,
  onEdit,
  onAdd,
  addLabel,
}: EntityListProps<T>) {
  return (
    <div className="space-y-3">
      <Button variant="primary" size="sm" onClick={onAdd}>
        + {addLabel}
      </Button>

      {items.length === 0 && (
        <p className="py-8 text-center text-text-muted">No items yet</p>
      )}

      {items.map((item) => {
        const subtitle = getSubtitle?.(item);
        return (
          <Card key={getId(item)} padding={false}>
            <div className="flex min-h-touch items-center justify-between px-4 py-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="min-w-0">
                  <span className="block truncate font-medium">{getName(item)}</span>
                  {subtitle && (
                    <span className="block truncate text-sm text-text-secondary">{subtitle}</span>
                  )}
                </div>
                {!getIsActive(item) && <Badge variant="warning">Inactive</Badge>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                Edit
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
