import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DemoEditModal } from './DemoEditModal';
import { useAuth } from '@/contexts/AuthContext';
import { useSessionTracking } from '@/hooks/useSessionTracking';
import { demoService, supabase } from '@/lib/supabase';
import { favoritesService } from '@/lib/supabase';
import { Demo } from '@/types/demo';
import { ExternalLink, FileText, BookOpen, FolderOpen, Eye, Edit3, Trash2, MoreHorizontal, Star, Play, Pause, Heart } from 'lucide-react';
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
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import React, { memo } from 'react';

interface DemoCardProps {
  demo: Demo;
  onViewIncrement?: (id: string) => void;
  onUpdate?: (updatedDemo: Demo) => void;
  onDelete?: (demoId: string) => void;
  onToggleFavorite?: (demoId: string) => void;
  isFavorited?: boolean;
  onPromptOrganize?: (demoId: string) => void;
}

export const DemoCard = memo(({ demo, onViewIncrement, onUpdate, onDelete, onToggleFavorite, isFavorited = false, onPromptOrganize }: DemoCardProps) => {
  const { isAdmin, user } = useAuth();
  const { trackDemoView, trackDemoFavorite, trackDemoTryApp } = useSessionTracking();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingFeatured, setIsUpdatingFeatured] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoCanPlay, setVideoCanPlay] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Track demo view when component mounts
  useEffect(() => {
    if (user) {
      trackDemoView(demo.id, demo.title);
    }
  }, [demo.id, demo.title, user, trackDemoView]);

  // Memoized video info calculation
  const videoInfo = useMemo(() => {
    if (!demo.video_url) return null;
    
    const url = demo.video_url;
    if (!url) return null;
    
    // Check if it's a Google Drive view URL
    const googleDriveRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/view/;
    if (googleDriveRegex.test(url)) {
      return {
        type: 'google_drive_webpage',
        embedUrl: url,
        originalUrl: url
      };
    }
    
    // Check if it's a Tella.tv URL
    const tellaRegex = /tella\.tv\/video\/([a-zA-Z0-9_-]+)/;
    const tellaMatch = url.match(tellaRegex);
    if (tellaRegex.test(url)) {
      const videoId = tellaMatch ? tellaMatch[1] : '';
      return {
        type: 'tella',
        embedUrl: videoId ? `https://tella.tv/video/${videoId}/embed` : url,
        originalUrl: url
      };
    }
    
    // Check if it's a YouTube URL
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(youtubeRegex);
    
    if (match) {
      const videoId = match[1];
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        originalUrl: url
      };
    }
    
    // For direct video files
    return {
      type: 'video',
      embedUrl: url,
      originalUrl: url
    };
  }, [demo.video_url]);

  // Debug video URL and test accessibility
  useEffect(() => {
    if (demo.video_url && videoInfo?.type === 'video') {
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
    
    if (demo.video_url && videoInfo?.type === 'youtube') {
      console.log('🎬 YouTube URL for demo:', demo.title, demo.video_url);
    }
    
    if (demo.video_url && videoInfo?.type === 'tella_webpage') {
      console.log('📹 Tella.tv URL for demo:', demo.title, demo.video_url);
    }
    
    if (demo.video_url && videoInfo?.type === 'tella') {
      console.log('📹 Tella.tv embed URL for demo:', demo.title, 'Original:', demo.video_url, 'Embed:', videoInfo.embedUrl);
    }
    
    if (demo.video_url && videoInfo?.type === 'google_drive_webpage') {
      console.log('📁 Google Drive URL for demo:', demo.title, demo.video_url);
    }
  }, [demo.video_url, demo.title, videoInfo]);
  
  const handleTryApp = useCallback(async () => {
    try {
      // Track the try app action
      trackDemoTryApp(demo.id, demo.title, demo.netlify_url);
      
      await demoService.incrementPageViews(demo.id);
      if (onViewIncrement) {
        onViewIncrement(demo.id);
      }
    } catch (error) {
      console.error('Failed to increment page views:', error);
    }
    window.open(demo.netlify_url, '_blank');
  }, [demo.id, demo.title, demo.netlify_url, trackDemoTryApp, onViewIncrement]);

  const handleEdit = useCallback(() => {
    setShowEditModal(true);
  }, []);

  const handleDelete = useCallback(async () => {
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
  }, [demo.id, onDelete]);

  const handleUpdateSuccess = useCallback((updatedDemo: Demo) => {
    if (onUpdate) {
      onUpdate(updatedDemo);
    }
  }, [onUpdate]);

  const handleToggleFeatured = useCallback(async (featured: boolean) => {
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
  }, [demo.id, isAdmin, onUpdate]);

  const toggleFavorite = useCallback(async (demoId: string) => {
    try {
      const result = await favoritesService.toggleFavorite(demoId);
      return result;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return undefined;
    }
  }, []);

  const handleToggleFavorite = useCallback(async () => {
    if (isFavoriting) return;
    
    if (!user) {
      toast.error('Please log in to favorite demos');
      return;
    }
    
    setIsFavoriting(true);
    try {
      let result = false;
      if (onToggleFavorite) {
        result = await onToggleFavorite(demo.id);
      }
      
      // Track the favorite action
      trackDemoFavorite(demo.id, demo.title, result);
      
      if (result) {
        // Show organize prompt for newly favorited demos with better UX
        toast.success('Added to favorites! 💝', {
          description: 'Visit the Favorites tab to organize into folders',
          duration: 4000,
        });
      } else {
        toast.success('Removed from favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
    } finally {
      setIsFavoriting(false);
    }
  }, [isFavoriting, user, onToggleFavorite, demo.id, demo.title, trackDemoFavorite]);

  const handleVideoToggle = useCallback(() => {
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
  }, [isVideoPlaying]);

  const handleVideoLoadStart = useCallback(() => {
    console.log('🔄 Video loading started for:', demo.title);
    setVideoLoading(true);
    setVideoError(null);
  }, [demo.title]);

  const handleVideoCanPlay = useCallback(() => {
    console.log('✅ Video can play:', demo.title);
    setVideoLoading(false);
    setVideoCanPlay(true);
  }, [demo.title]);

  const handleVideoError = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
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
  }, [demo.title, demo.video_url]);

  const handleVideoPlay = useCallback(() => {
    console.log('▶️ Video started playing:', demo.title);
  }, [demo.title]);

  const handleVideoPause = useCallback(() => {
    console.log('⏸️ Video paused:', demo.title);
  }, [demo.title]);

  const handleVideoEnded = useCallback(() => {
    console.log('🏁 Video ended:', demo.title);
  }, [demo.title]);
  
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const formattedDate = useMemo(() => formatDate(demo.created_at), [demo.created_at, formatDate]);

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
              <div className="flex items-center gap-1">
                {/* Favorite Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleFavorite}
                  disabled={isFavoriting}
                  className={`h-8 w-8 p-0 transition-all duration-200 ${
                    isFavorited 
                      ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100' 
                     : 'text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50'
                  }`}
                  title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500' : ''}`} />
                </Button>
                
                {/* Admin Menu */}
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
                className="w-16 h-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowScreenshotModal(true)}
                title="Click to view full size"
              />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Video Player */}
        {videoInfo && (
          <div className="mb-4">
            {videoInfo.type === 'google_drive_webpage' ? (
              // External webpage - show preview with open button
              <div className="relative aspect-video bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg overflow-hidden border-2 border-gray-200 flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Video on Google Drive
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    This video is hosted on Google Drive and will open in a new tab
                  </p>
                  <Button
                    onClick={() => window.open(demo.video_url, '_blank')}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Google Drive
                  </Button>
                </div>
                
                {/* Platform Badge */}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-purple-600/90 text-white border-0">
                    <Play className="w-3 h-3 mr-1" />
                    Google Drive
                  </Badge>
                </div>
              </div>
            ) : videoInfo.type === 'tella' ? (
              // Tella.tv embed
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                <iframe
                  src={videoInfo.embedUrl}
                  title={demo.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                
                {/* Platform Badge */}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-purple-600/90 text-white border-0">
                    <Play className="w-3 h-3 mr-1" />
                    Tella.tv
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                {videoInfo.type === 'youtube' ? (
                  // YouTube embed
                  <iframe
                    src={videoInfo.embedUrl}
                    title={demo.title}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                <>
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
                </>
                )}
                
                {/* Video Status Indicators */}
                <div className="absolute top-2 left-2 flex gap-2">
                  <Badge className="bg-black/70 text-white border-0">
                    <Play className="w-3 h-3 mr-1" />
                    {videoInfo.type === 'youtube' ? 'YouTube' : videoInfo.type === 'tella' ? 'Tella.tv' : 'Video'}
                  </Badge>
                  {videoInfo.type === 'video' && !videoError && (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Video URL Debug Info (development only) */}
            {process.env.NODE_ENV === 'development' && demo.video_url && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
                <strong>Debug:</strong> {demo.video_url}
                {videoInfo && (
                  <div><strong>Type:</strong> {videoInfo.type}</div>
                )}
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
              <span>{formattedDate}</span>
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
                  title="View Excalidraw Design"
                >
                  <FileText className="w-4 h-4" />
                </Button>
              )}
              
              {demo.notion_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(demo.notion_url, '_blank')}
                  className="p-2 border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
                  title="View Customer Documentation"
                >
                  <BookOpen className="w-4 h-4" />
                </Button>
              )}
              
              {demo.drive_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(demo.drive_url, '_blank')}
                  className="p-2 border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
                  title="Access Customer Resources"
                >
                  <FolderOpen className="w-4 h-4" />
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

    {/* Screenshot Zoom Modal */}
    {showScreenshotModal && demo.screenshot_url && (
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
        onClick={() => setShowScreenshotModal(false)}
      >
        <div className="relative max-w-4xl max-h-full">
          {/* Close Button */}
          <button
            onClick={() => setShowScreenshotModal(false)}
            className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors z-10"
            aria-label="Close screenshot"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-black bg-opacity-50 hover:bg-opacity-70">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </button>
          
          {/* Screenshot Image */}
          <img
            src={demo.screenshot_url}
            alt={demo.title}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Image Caption */}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4 rounded-b-lg">
            <h3 className="font-semibold text-lg">{demo.title}</h3>
            <p className="text-gray-300 text-sm">{demo.owner} • {formattedDate}</p>
          </div>
        </div>
      </div>
    )}
    </>
  );
});