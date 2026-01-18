import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SavedSearchTagsProps {
  savedSearches: string[];
  onRemove: (search: string) => void;
  onSelect: (search: string) => void;
}

export const SavedSearchTags = ({ savedSearches, onRemove, onSelect }: SavedSearchTagsProps) => {
  if (savedSearches.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <span className="text-xs text-muted-foreground self-center">Recent:</span>
      {savedSearches.map((search) => (
        <Badge
          key={search}
          variant="secondary"
          className="pl-3 pr-1 py-1 flex items-center gap-1 cursor-pointer hover:bg-secondary/80 transition-colors"
          onClick={() => onSelect(search)}
        >
          <span className="text-xs">{search}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(search);
            }}
            className="ml-1 p-0.5 rounded-full hover:bg-background/50 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
};
