
import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import ImageCropper from "@/components/ImageCropper";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const handleImageSelect = (imageDataURL: string) => {
    setSelectedImage(imageDataURL);
    setCroppedImage(null);
    setIsCropping(true);
  };

  const handleCropComplete = (croppedImageDataURL: string) => {
    setCroppedImage(croppedImageDataURL);
    setIsCropping(false);
  };

  const handleCropCancel = () => {
    setIsCropping(false);
  };

  const handleUpload = () => {
    // In a real app, you would send the image to a server here
    toast.success("Image successfully uploaded!", {
      description: "Your cropped image has been processed.",
    });
    // Reset the state to allow for a new image
    setSelectedImage(null);
    setCroppedImage(null);
  };

  const handleStartOver = () => {
    setSelectedImage(null);
    setCroppedImage(null);
    setIsCropping(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-3xl">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            Image Crop & Upload
          </h1>
          <p className="text-gray-600">
            Select an image, crop it precisely with 4 corner points, and upload
          </p>
        </header>

        <div className="bg-white rounded-xl shadow-md p-6 w-full">
          {!selectedImage ? (
            <ImageUploader onImageSelect={handleImageSelect} />
          ) : isCropping ? (
            <ImageCropper
              imageUrl={selectedImage}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
            />
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-medium text-gray-800 mb-2">
                  Cropped Result
                </h2>
                <div className="flex justify-center">
                  <img
                    src={croppedImage || ""}
                    alt="Cropped"
                    className="max-h-96 rounded-md border border-gray-200"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={handleStartOver}
                  className="w-full sm:w-auto"
                >
                  Start Over
                </Button>
                <Button 
                  onClick={handleUpload} 
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                >
                  Upload Image
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
