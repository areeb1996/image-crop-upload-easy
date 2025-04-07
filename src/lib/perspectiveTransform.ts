
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
        backgroundColor: 'transparent',
      });

      // Load the image
      fabric.Image.fromURL(imageUrl, (img) => {
        if (!img.width || !img.height) {
          reject(new Error("Failed to load image dimensions"));
          return;
        }

        // Apply the perspective transform
        // This uses fabric's clipPath feature to create the effect
        const clipPath = new fabric.Polygon(sourcePoints, {
          left: 0,
          top: 0,
          absolutePositioned: true,
        });

        // Create a new image with the original dimensions
        const outputImg = new fabric.Image(img.getElement(), {
          left: 0,
          top: 0,
          width: width,
          height: height,
          scaleX: width / img.width,
          scaleY: height / img.height,
          clipPath: clipPath,
          absolutePositioned: true,
        });
        
        // Add image to canvas
        canvas.add(outputImg);
        canvas.renderAll();
        
        // Get the data URL
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
