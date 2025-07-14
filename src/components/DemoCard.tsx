import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DemoEditModal } from './DemoEditModal';
import { useAuth } from '@/contexts/AuthContext';
import { demoService } from '@/lib/supabase';
import { Demo } from '@/types/demo';
import { ExternalLink, FileText, Database, Shield, Eye, Edit3, Trash2, MoreHorizontal, Star, Play, Pause } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';

interface DemoCardProps {
  demo: Demo;
  onViewIncrement?: (id: string) => void;
  onUpdate?: (updatedDemo: Demo) => void;
  onDelete?: (demoId: string) => void;
}

export function DemoCard({ demo, onViewIncrement, onUpdate, onDelete }: DemoCardProps) {
  const { isAdmin } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingFeatured, setIsUpdatingFeatured] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoCanPlay, setVideoCanPlay] = useState(false);

  // Debug video URL and test accessibility
  useEffect(() => {
    if (demo.video_url) {
      console.log('🎥 Video URL for demo:', demo.title, demo.video_url);
      
      // Test if the video URL is accessible
      fetch(demo.video_url, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            console.log('✅ Video URL is accessible:', demo.video_url);
          } else {
            console.warn('⚠️ Video URL returned status:', response.status, demo.video_url);
            setVideoError(`Video unavailable (${response.status})`);
          }
        })
        .catch(error => {
          console.error('❌ Video URL not accessible:', demo.video_url, error);
          setVideoError('Video URL not accessible');
        });
    }
  }, [demo.video_url, demo.title]);
  const handleTryApp = async () => {
    try {
      await demoService.incrementPageViews(demo.id);
      if (onViewIncrement) {
        onViewIncrement(demo.id);
      }
    } catch (error) {
      console.error('Failed to increment page views:', error);
    }
    window.open(demo.netlify_url, '_blank');
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await demoService.deleteDemo(demo.id);
      toast.success('Demo deleted successfully');
      if (onDelete) {
        onDelete(demo.id);
      }
    } catch (error) {
      console.error('Error deleting demo:', error);
      toast.error('Failed to delete demo');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleUpdateSuccess = (updatedDemo: Demo) => {
    if (onUpdate) {
      onUpdate(updatedDemo);
    }
  };

  const handleToggleFeatured = async (featured: boolean) => {
    if (!isAdmin) return;
    
    setIsUpdatingFeatured(true);
    try {
      const updatedDemo = await demoService.updateDemo(demo.id, { is_featured: featured });
      toast.success(featured ? 'Demo featured successfully' : 'Demo unfeatured successfully');
      if (onUpdate) {
        onUpdate(updatedDemo);
      }
    } catch (error) {
      console.error('Error updating featured status:', error);
      toast.error('Failed to update featured status');
    } finally {
      setIsUpdatingFeatured(false);
    }
  };

  const handleVideoToggle = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
        setIsVideoPlaying(true);
      }
    }
  };

  const handleVideoLoadStart = () => {
    console.log('🔄 Video loading started for:', demo.title);
    setVideoLoading(true);
    setVideoError(null);
  };

  const handleVideoCanPlay = () => {
    console.log('✅ Video can play:', demo.title);
    setVideoLoading(false);
    setVideoCanPlay(true);
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const error = video.error;
    console.error('❌ Video error for:', demo.title, {
      code: error?.code,
      message: error?.message,
      networkState: video.networkState,
      readyState: video.readyState,
      url: demo.video_url
    });
    
    setVideoLoading(false);
    setVideoCanPlay(false);
    
    const errorMessages = {
      1: 'Video loading aborted',
      2: 'Network error loading video',
      3: 'Video format not supported',
      4: 'Video source not found'
    };
    
    setVideoError(errorMessages[error?.code as keyof typeof errorMessages] || 'Unknown video error');
  };

  const handleVideoPlay = () => {
    console.log('▶️ Video started playing:', demo.title);
  };

  const handleVideoPause = () => {
    console.log('⏸️ Video paused:', demo.title);
  };

  const handleVideoEnded = () => {
    console.log('🏁 Video ended:', demo.title);
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
    <Card className="group hover:shadow-lg transition-all duration-300 border-gray-200 bg-white group/video">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold text-black">
                  {demo.title}
                </CardTitle>
                {demo.is_featured && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:border-yellow-500 hover:border-2 hover:bg-white transition-all duration-200">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleToggleFeatured(!demo.is_featured)}
                      disabled={isUpdatingFeatured}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      {demo.is_featured ? 'Unfeature' : 'Feature'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <CardDescription className="text-gray-600 text-sm leading-relaxed">
              {demo.description}
            </CardDescription>
          </div>
          {demo.screenshot_url && (
            <div className="ml-4 flex-shrink-0">
              <img 
                src={demo.screenshot_url} 
                alt={demo.title}
                className="w-16 h-16 object-cover rounded border border-gray-200"
              />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Video Player */}
        {demo.video_url && (
          <div className="mb-4">
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
              {/* Video Loading State */}
              {videoLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading video...</p>
                  </div>
                </div>
              )}
              
              {/* Video Error State */}
              {videoError && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
                  <div className="text-center p-4">
                    <div className="text-red-500 mb-2">⚠️</div>
                    <p className="text-sm text-red-600 font-medium mb-1">Video Error</p>
                    <p className="text-xs text-red-500">{videoError}</p>
                    <p className="text-xs text-gray-500 mt-2 break-all">{demo.video_url}</p>
                  </div>
                </div>
              )}
              
              <video
                ref={videoRef}
                controls
                className="w-full h-full object-cover"
                poster={demo.screenshot_url}
                onLoadStart={handleVideoLoadStart}
                onCanPlay={handleVideoCanPlay}
                onError={handleVideoError}
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onEnded={handleVideoEnded}
                preload="metadata"
                crossOrigin="anonymous"
                style={{ display: videoError ? 'none' : 'block' }}
              >
                <source src={demo.video_url} type="video/mp4" />
                <p className="p-4 text-center text-gray-600">
                  Your browser does not support the video tag.
                  <br />
                  <a href={demo.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    View video in new tab
                  </a>
                </p>
              </video>
              
              {/* Video Status Indicators */}
              {!videoError && (
                <div className="absolute top-2 left-2 flex gap-2">
                  <Badge className="bg-black/70 text-white border-0">
                    <Play className="w-3 h-3 mr-1" />
                    Video
                  </Badge>
                  {!videoCanPlay && !videoLoading && (
                    <Badge className="bg-yellow-500/70 text-white border-0">
                      Loading...
                    </Badge>
                  )}
                  {videoCanPlay && (
                    <Badge className="bg-green-500/70 text-white border-0">
                      Ready
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Debug Info (remove in production) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs p-1 rounded">
                  {videoCanPlay ? '✅ Ready' : videoLoading ? '🔄 Loading' : '❌ Error'}
                </div>
              )}
            </div>
            
            {/* Video URL Debug Info (development only) */}
            {process.env.NODE_ENV === 'development' && demo.video_url && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
                <strong>Debug:</strong> {demo.video_url}
              </div>
            )}
          </div>
        )}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {demo.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{demo.page_views.toLocaleString()} views</span>
            </div>
            <div>
              <span className="font-medium">{demo.owner}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(demo.created_at)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleTryApp}
              className="bg-black hover:bg-gray-800 text-white flex-1"
              size="sm"
            >
              <ExternalLink className="w-4 h-4 mr-1.5" />
              Try App
            </Button>
            
            <div className="flex gap-1">
              {demo.excalidraw_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(demo.excalidraw_url, '_blank')}
                  className="p-2 border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
                >
                  <FileText className="w-4 h-4" />
                </Button>
              )}
              
              {demo.supabase_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(demo.supabase_url, '_blank')}
                  className="p-2 border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
                >
                  <Database className="w-4 h-4" />
                </Button>
              )}
              
              {demo.admin_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(demo.admin_url, '_blank')}
                  className="p-2 border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
                >
                  <Shield className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {showEditModal && (
      <DemoEditModal
        demo={demo}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleUpdateSuccess}
      />
    )}

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the demo 
            "{demo.title}" and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}