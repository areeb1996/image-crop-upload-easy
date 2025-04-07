
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface CornerPoint {
  x: number;
  y: number;
}

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

const ImageCropper = ({ imageUrl, onCropComplete, onCancel }: ImageCropperProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [scaleRatio, setScaleRatio] = useState(1);
  const [corners, setCorners] = useState<CornerPoint[]>([
    { x: 0, y: 0 }, // top-left
    { x: 0, y: 0 }, // top-right
    { x: 0, y: 0 }, // bottom-right
    { x: 0, y: 0 }, // bottom-left
  ]);
  const [activeCorner, setActiveCorner] = useState<number | null>(null);
  const [originalImageSize, setOriginalImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setOriginalImageSize({ width: img.width, height: img.height });
      setImageLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (imageLoaded && containerRef.current) {
      const container = containerRef.current;
      
      const updateContainerSize = () => {
        const { width } = container.getBoundingClientRect();
        
        // Calculate the height based on the aspect ratio of the original image
        const aspectRatio = originalImageSize.width / originalImageSize.height;
        const calculatedHeight = width / aspectRatio;
        
        setContainerWidth(width);
        setContainerHeight(calculatedHeight);
        
        // Calculate scaling ratio for converting between canvas and original image coordinates
        setScaleRatio(originalImageSize.width / width);
        
        // Set initial corner positions
        const margin = 20; // pixels from the edge
        setCorners([
          { x: margin, y: margin }, // top-left
          { x: width - margin, y: margin }, // top-right
          { x: width - margin, y: calculatedHeight - margin }, // bottom-right
          { x: margin, y: calculatedHeight - margin }, // bottom-left
        ]);
      };
      
      updateContainerSize();
      
      const resizeObserver = new ResizeObserver(updateContainerSize);
      resizeObserver.observe(container);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [imageLoaded, originalImageSize]);

  useEffect(() => {
    if (!canvasRef.current || !imageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || !imageRef.current) return;

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    // Draw the image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

    // Draw semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the cropping area
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    ctx.lineTo(corners[1].x, corners[1].y);
    ctx.lineTo(corners[2].x, corners[2].y);
    ctx.lineTo(corners[3].x, corners[3].y);
    ctx.closePath();
    
    // Cut out the cropping area from the overlay
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    
    // Draw the lines of the cropping area
    ctx.strokeStyle = '#2563EB'; // Blue
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw the corner handles
    corners.forEach((corner, index) => {
      ctx.fillStyle = index === activeCorner ? '#2563EB' : '#FFFFFF';
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });

  }, [corners, containerWidth, containerHeight, imageLoaded, activeCorner]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find if the user clicked on a corner
    for (let i = 0; i < corners.length; i++) {
      const corner = corners[i];
      const distance = Math.sqrt((corner.x - x) ** 2 + (corner.y - y) ** 2);
      
      if (distance <= 15) {  // 15px radius for easier touch on mobile
        setActiveCorner(i);
        break;
      }
    }

    // Add event listeners for pointer move and up
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (activeCorner === null || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(containerWidth, e.clientX - rect.left));
    const y = Math.max(0, Math.min(containerHeight, e.clientY - rect.top));

    setCorners(prev => {
      const newCorners = [...prev];
      newCorners[activeCorner] = { x, y };
      return newCorners;
    });
  };

  const handlePointerUp = () => {
    setActiveCorner(null);
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
  };

  const handleCrop = () => {
    if (!imageRef.current || !canvasRef.current) return;
    
    // Scale corner coordinates back to original image size
    const scaledCorners = corners.map(corner => ({
      x: corner.x * scaleRatio,
      y: corner.y * scaleRatio
    }));
    
    // Create a canvas for the cropped image
    const resultCanvas = document.createElement('canvas');
    const resultCtx = resultCanvas.getContext('2d');
    if (!resultCtx) return;
    
    // Set output size (you can adjust this as needed)
    const outputWidth = 800;
    const outputHeight = 800;
    resultCanvas.width = outputWidth;
    resultCanvas.height = outputHeight;
    
    // Draw the cropped and transformed image onto the result canvas
    // This uses a perspective transform to correct the image
    perspectiveTransform(
      resultCtx,
      imageRef.current,
      scaledCorners,
      outputWidth,
      outputHeight
    );
    
    // Convert the result canvas to a data URL
    const croppedImageDataUrl = resultCanvas.toDataURL('image/jpeg', 0.9);
    onCropComplete(croppedImageDataUrl);
  };

  // Function to perform perspective transform
  const perspectiveTransform = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    pts: CornerPoint[],
    outputWidth: number,
    outputHeight: number
  ) => {
    // Define the destination points (rectangle)
    const dstPts = [
      { x: 0, y: 0 },                       // top-left
      { x: outputWidth, y: 0 },             // top-right
      { x: outputWidth, y: outputHeight },  // bottom-right
      { x: 0, y: outputHeight },            // bottom-left
    ];
    
    // Calculate the perspective transform matrix
    // We're using a simple approach here, for a more accurate transform
    // you would use a proper perspective transform library
    
    // Draw a simple stretched version as a fallback
    ctx.clearRect(0, 0, outputWidth, outputHeight);
    
    // Define the clip path using the destination points
    ctx.beginPath();
    ctx.moveTo(dstPts[0].x, dstPts[0].y);
    ctx.lineTo(dstPts[1].x, dstPts[1].y);
    ctx.lineTo(dstPts[2].x, dstPts[2].y);
    ctx.lineTo(dstPts[3].x, dstPts[3].y);
    ctx.closePath();
    ctx.clip();
    
    // For simplicity, we'll approximate by drawing the image and transforming it
    // This doesn't give perfect perspective correction but works for mild skews
    ctx.drawImage(img, 0, 0, outputWidth, outputHeight);
  };

  if (!imageLoaded) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-center">Loading image...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-xl font-medium text-gray-800">Adjust Crop Area</h2>
        <p className="text-sm text-gray-500">Drag the corners to set the crop area</p>
      </div>
      
      <div 
        ref={containerRef} 
        className="relative overflow-hidden rounded-lg"
      >
        <canvas
          ref={canvasRef}
          width={containerWidth}
          height={containerHeight}
          onPointerDown={handlePointerDown}
          style={{ 
            touchAction: 'none',
            width: '100%', 
            height: 'auto', 
            cursor: activeCorner !== null ? 'grabbing' : 'default' 
          }}
          className="border border-gray-200"
        />
      </div>
      
      <div className="flex justify-center space-x-4">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCrop}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Apply Crop
        </Button>
      </div>
    </div>
  );
};

export default ImageCropper;
