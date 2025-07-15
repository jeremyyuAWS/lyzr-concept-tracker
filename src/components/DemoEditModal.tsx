import { useState } from 'react';
import { Demo } from '@/types/demo';
import { demoService } from '@/lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TagInput } from './TagInput';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit3, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

// Helper function to convert GitHub blob URLs to raw format
const convertGitHubUrl = (url: string): { convertedUrl: string; wasConverted: boolean } => {
  const githubBlobRegex = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/(.+)$/;
  const match = url.match(githubBlobRegex);
  
  if (match) {
    const [, username, repo, pathWithBranch] = match;
    const convertedUrl = `https://raw.githubusercontent.com/${username}/${repo}/${pathWithBranch}`;
    return { convertedUrl, wasConverted: true };
  }
  
  return { convertedUrl: url, wasConverted: false };
};

interface DemoEditModalProps {
  demo: Demo;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedDemo: Demo) => void;
}

export function DemoEditModal({ demo, isOpen, onClose, onSuccess }: DemoEditModalProps) {
  const [formData, setFormData] = useState({
    title: demo.title,
    description: demo.description,
    tags: demo.tags,
    netlify_url: demo.netlify_url,
    excalidraw_url: demo.excalidraw_url || '',
    supabase_url: demo.supabase_url || '',
    admin_url: demo.admin_url || '',
    screenshot_url: demo.screenshot_url || '',
    owner: demo.owner,
    video_url: demo.video_url || '',
    is_featured: demo.is_featured || false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<typeof formData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.tags.length === 0) {
      newErrors.tags = 'At least one tag is required';
    }

    if (!formData.netlify_url.trim()) {
      newErrors.netlify_url = 'Netlify URL is required';
    } else if (!formData.netlify_url.includes('netlify.app')) {
      newErrors.netlify_url = 'Please enter a valid Netlify URL';
    }

    if (!formData.owner.trim()) {
      newErrors.owner = 'Owner is required';
    }

    if (formData.screenshot_url && !formData.screenshot_url.startsWith('http')) {
      newErrors.screenshot_url = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updates = {
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
        netlify_url: formData.netlify_url,
        excalidraw_url: formData.excalidraw_url || undefined,
        supabase_url: formData.supabase_url || undefined,
        admin_url: formData.admin_url || undefined,
        screenshot_url: formData.screenshot_url || undefined,
        owner: formData.owner,
        video_url: formData.video_url || undefined,
        is_featured: formData.is_featured || false
      };
      
      const updatedDemo = await demoService.updateDemo(demo.id, updates);
      
      toast.success('Demo updated successfully!', {
        description: `${formData.title} has been updated.`,
      });
      
      onSuccess(updatedDemo);
      onClose();
    } catch (error) {
      console.error('Error updating demo:', error);
      toast.error('Failed to update demo', {
        description: 'Please try again or contact support.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-convert GitHub URLs for screenshot_url
    if (field === 'screenshot_url' && typeof value === 'string' && value.includes('github.com')) {
      const { convertedUrl, wasConverted } = convertGitHubUrl(value);
      if (wasConverted) {
        setFormData(prev => ({ ...prev, [field]: convertedUrl }));
        toast.success('GitHub URL automatically converted to raw format!', {
          description: 'The GitHub blob URL has been converted for direct image access.',
        });
      }
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleImageChange = (url: string) => {
    setFormData(prev => ({ ...prev, screenshot_url: url }));
  };

  const handleImageRemove = () => {
    setFormData(prev => ({ ...prev, screenshot_url: '' }));
  };

  const handleTagsChange = (tags: string[]) => {
    setFormData(prev => ({ ...prev, tags }));
    
    // Clear error when tags are added
    if (errors.tags) {
      setErrors(prev => ({ ...prev, tags: undefined }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto [&>button.absolute]:bg-white [&>button.absolute]:text-black [&>button.absolute:hover]:bg-gray-100 [&>button.absolute]:rounded-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-black">
            <Edit3 className="w-5 h-5" />
            Edit Demo
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Update the demo information and metadata
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-black">
                Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter demo title"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-red-500 text-xs">{errors.title}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="owner" className="text-sm font-medium text-black">
                Owner *
              </Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => handleInputChange('owner', e.target.value)}
                placeholder="Enter owner name"
                className={errors.owner ? 'border-red-500' : ''}
              />
              {errors.owner && <p className="text-red-500 text-xs">{errors.owner}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-black">
              Description *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the demo concept and functionality"
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
          </div>

          <TagInput
            tags={formData.tags}
            onTagsChange={handleTagsChange}
            placeholder="Enter a tag and press Enter"
            required
            error={errors.tags}
          />

          <div className="space-y-2">
            <Label htmlFor="netlify_url" className="text-sm font-medium text-black">
              Netlify URL *
            </Label>
            <Input
              id="netlify_url"
              value={formData.netlify_url}
              onChange={(e) => handleInputChange('netlify_url', e.target.value)}
              placeholder="https://your-demo.netlify.app"
              className={errors.netlify_url ? 'border-red-500' : ''}
            />
            {errors.netlify_url && <p className="text-red-500 text-xs">{errors.netlify_url}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="excalidraw_url" className="text-sm font-medium text-black">
                Excalidraw URL
              </Label>
              <Input
                id="excalidraw_url"
                value={formData.excalidraw_url}
                onChange={(e) => handleInputChange('excalidraw_url', e.target.value)}
                placeholder="https://excalidraw.com/..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supabase_url" className="text-sm font-medium text-black">
                Supabase URL
              </Label>
              <Input
                id="supabase_url"
                value={formData.supabase_url}
                onChange={(e) => handleInputChange('supabase_url', e.target.value)}
                placeholder="https://supabase.com/..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin_url" className="text-sm font-medium text-black">
              Admin URL
            </Label>
            <Input
              id="admin_url"
              value={formData.admin_url}
              onChange={(e) => handleInputChange('admin_url', e.target.value)}
              placeholder="https://your-demo.netlify.app/admin"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="video_url" className="text-sm font-medium text-black">
                Video Overview URL
              </Label>
              <Input
                id="video_url"
                value={formData.video_url}
                onChange={(e) => handleInputChange('video_url', e.target.value)}
                placeholder="https://youtube.com/watch?v=... or https://example.com/video.mp4"
              />
              <p className="text-xs text-gray-500">
                Optional: Add a YouTube URL or direct video file URL
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-black">
                Featured Demo
              </Label>
              <div className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Checkbox
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => handleInputChange('is_featured', checked as boolean)}
                  className="bg-white border-2 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white h-5 w-5"
                />
                <div className="flex-1 cursor-pointer" onClick={() => handleInputChange('is_featured', !formData.is_featured)}>
                  <Label htmlFor="is_featured" className="text-sm font-medium text-black cursor-pointer pointer-events-none">
                    Mark as featured demo
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Featured demos appear in the spotlight section
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="screenshot_url" className="text-sm font-medium text-black">
              Screenshot URL
            </Label>
            <Input
              id="screenshot_url"
              value={formData.screenshot_url}
              onChange={(e) => handleInputChange('screenshot_url', e.target.value)}
              placeholder="https://example.com/screenshot.png"
              className={errors.screenshot_url ? 'border-red-500' : ''}
            />
            {errors.screenshot_url && <p className="text-red-500 text-xs">{errors.screenshot_url}</p>}
            <p className="text-xs text-gray-500">
              Optional: Add a direct link to a screenshot image (PNG, JPG, etc.)
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-black hover:bg-blue-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Demo
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}