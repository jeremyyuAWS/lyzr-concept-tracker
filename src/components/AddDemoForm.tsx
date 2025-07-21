import { useState } from 'react';
import { demoService } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { TagInput } from './TagInput';
import { DemoFormData } from '@/types/demo';
import { Plus, Loader2 } from 'lucide-react';
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

interface AddDemoFormProps {
  onSubmit: (data: DemoFormData) => Promise<void>;
  onSuccess?: () => void;
}

export function AddDemoForm({ onSubmit, onSuccess }: AddDemoFormProps) {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState<DemoFormData>({
    title: '',
    description: '',
    tags: [],
    netlify_url: '',
    excalidraw_url: '',
    notion_url: '',
    drive_url: '',
    screenshot_url: '',
    owner: userProfile?.display_name || userProfile?.email || '',
    video_url: '',
    is_featured: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<DemoFormData>>({});

  // Auto-populate owner field when user profile changes
  useState(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        owner: userProfile.display_name || userProfile.email || ''
      }));
    }
  }, [userProfile]);

  const validateForm = (): boolean => {
    const newErrors: Partial<DemoFormData> = {};

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
      // Convert form data to demo data
      const demoData = {
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
        netlify_url: formData.netlify_url,
        excalidraw_url: formData.excalidraw_url || undefined,
        notion_url: formData.notion_url || undefined,
        drive_url: formData.drive_url || undefined,
        screenshot_url: formData.screenshot_url || undefined,
        owner: formData.owner,
        video_url: formData.video_url || undefined,
        is_featured: formData.is_featured || false
      };
      
      await demoService.addDemo(demoData);
      
      toast.success('Demo added successfully!', {
        description: `${formData.title} has been added to the catalog.`,
        duration: 3000,
      });
      
      // Reset form on success
      setFormData({
        title: '',
        description: '',
        tags: [],
        netlify_url: '',
        excalidraw_url: '',
        notion_url: '',
        drive_url: '',
        screenshot_url: '',
        owner: '',
        video_url: '',
        is_featured: false
      });
      setErrors({});
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting demo:', error);
      toast.error('Failed to add demo', {
        description: 'Please try again or contact support.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof DemoFormData, value: string | boolean) => {
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

  const handleTagsChange = (tags: string[]) => {
    setFormData(prev => ({ ...prev, tags }));
    
    // Clear error when tags are added
    if (errors.tags) {
      setErrors(prev => ({ ...prev, tags: undefined }));
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-black">
          <Plus className="w-5 h-5" />
          Add New Demo
        </CardTitle>
        <CardDescription className="text-gray-600">
          Create a new entry in the concept tracker catalog
        </CardDescription>
      </CardHeader>
      
      <CardContent>
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
              Demo App URL *
            </Label>
            <Input
              id="netlify_url"
              value={formData.netlify_url}
              onChange={(e) => handleInputChange('netlify_url', e.target.value)}
              placeholder="https://your-demo-app.netlify.app"
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
              <Label htmlFor="notion_url" className="text-sm font-medium text-black">
                Customer Documentation (Notion)
              </Label>
              <Input
                id="notion_url"
                value={formData.notion_url}
                onChange={(e) => handleInputChange('notion_url', e.target.value)}
                placeholder="https://notion.so/..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="drive_url" className="text-sm font-medium text-black">
              Customer Resources (Google Drive)
            </Label>
            <Input
              id="drive_url"
              value={formData.drive_url}
              onChange={(e) => handleInputChange('drive_url', e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
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
                  className="featured-checkbox bg-white data-[state=checked]:bg-white data-[state=checked]:border-gray-800 data-[state=checked]:text-gray-800 border-2 border-gray-400 rounded-none h-5 w-5 relative"
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

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-black hover:bg-blue-600 text-white px-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding Demo...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Demo
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}