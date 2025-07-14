import { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function TagInput({ 
  tags, 
  onTagsChange, 
  label = "Tags",
  placeholder = "Enter a tag and press Enter",
  required = false,
  error 
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onTagsChange([...tags, trimmedTag]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleAddClick = () => {
    addTag(inputValue);
  };

  // Common technology tags for quick selection
  const commonTags = [
    'React', 'TypeScript', 'AI', 'Analytics', 'Dashboard', 'E-commerce',
    'Machine Learning', 'Database', 'API', 'Mobile', 'Web App', 'SaaS',
    'Productivity', 'Automation', 'Real-time', 'Chat', 'Social', 'Finance'
  ];

  const suggestedTags = commonTags.filter(tag => 
    !tags.includes(tag) && 
    tag.toLowerCase().includes(inputValue.toLowerCase())
  ).slice(0, 6);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-black">
        {label} {required && '*'}
      </Label>
      
      {/* Tags Display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {tags.map((tag, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 group"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 text-gray-500 hover:text-red-500 transition-colors bg-white rounded-full p-0.5 hover:bg-red-50"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input Field */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={error ? 'border-red-500' : ''}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddClick}
          disabled={!inputValue.trim() || tags.includes(inputValue.trim())}
          className="px-3"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Suggested Tags */}
      {inputValue && suggestedTags.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Suggested tags:</p>
          <div className="flex flex-wrap gap-1">
            {suggestedTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="cursor-pointer hover:bg-gray-100 text-xs"
                onClick={() => addTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-red-500 text-xs">{error}</p>}

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        Type a tag and press Enter to add it, or click suggested tags above
      </p>
    </div>
  );
}