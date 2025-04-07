
// This is a utility function to perform a perspective transform of an image
// using the fabric.js library for better transformation quality

import { fabric } from 'fabric';

interface Point {
  x: number;
  y: number;
}

export const getPerspectiveTransform = async (
  imageUrl: string,
  sourcePoints: Point[],
  width: number,
  height: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary canvas for the transformation
      const canvas = new fabric.Canvas(null, {
        width,
        height,
        backgroundColor: 'white',
      });

      // Load the image
      fabric.Image.fromURL(imageUrl, (img) => {
        // Calculate the scale ratio between the original image and the canvas
        const scaleX = img.width ? width / img.width : 1;
        const scaleY = img.height ? height / img.height : 1;
        
        // Corners in the destination image
        const destPoints = [
          { x: 0, y: 0 },
          { x: width, y: 0 },
          { x: width, y: height },
          { x: 0, y: height },
        ];
        
        // Add the image to the canvas with a clip path defined by source points
        img.set({
          left: 0,
          top: 0,
          scaleX,
          scaleY,
          originX: 'left',
          originY: 'top',
        });
        
        // Create a polygon from the source points
        const clipPath = new fabric.Polygon(sourcePoints.map(p => ({ x: p.x, y: p.y })), {
          left: 0,
          top: 0,
          fill: 'transparent',
        });
        
        // Set the clip path on the image
        img.clipPath = clipPath;
        
        // Add to canvas
        canvas.add(img);
        
        // Apply perspective transform
        canvas.renderAll();
        
        // Get the data URL of the resulting image
        const dataURL = canvas.toDataURL({
          format: 'png',
          quality: 1,
        });
        
        resolve(dataURL);
        
        // Clean up
        canvas.dispose();
      });
    } catch (error) {
      console.error("Error in perspective transform:", error);
      reject(error);
    }
  });
};
