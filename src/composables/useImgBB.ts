import { useToast } from "primevue/usetoast";
import { ref } from "vue";
import { MAX_IMAGE_SIZE, MAX_IMAGE_SIZE_MB } from "./constants";

export const useImgBB = () => {
  const toast = useToast();

  const selectedImage = ref<File | null>(null);
  const selectedImages = ref<File[]>([]);
  const imagePreview = ref<string>("");
  const imagePreviews = ref<string[]>([]);
  const uploadingImage = ref<boolean>(false);
  const existingImageUrls = ref<string[]>([]);

  const uploadToImgBB = async (file: File): Promise<string> => {
    const API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

    const reader = new FileReader();
    const base64Promise = new Promise<string | undefined>((resolve, reject) => {
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const base64Image = await base64Promise;

    const formData = new FormData();
    if (base64Image) formData.append("image", base64Image);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);

    const data = await response.json();

    if (data.success) return data.data.display_url;
    else throw new Error(data.error?.message || "Image upload failed");
  };

  const uploadImageIfExists = async () => {
    if (!selectedImage.value) return "";

    uploadingImage.value = true;
    try {
      return await uploadToImgBB(selectedImage.value);
    } finally {
      uploadingImage.value = false;
    }
  };

  const handleImageSelect = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      toast.add({
        severity: "error",
        summary: `სურათი ძალიან დიდია (მაქს. ${MAX_IMAGE_SIZE_MB}MB)`,
        life: 3000
      });
      return;
    }

    selectedImage.value = file;
    imagePreview.value = URL.createObjectURL(file);
  };

  const handleMultipleImagesSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);

    if (files.length === 0) return;

    const totalSize = files.reduce((total, file) => total + file.size, 0);
    if (totalSize > 20 * 1024 * 1024) {
      toast.add({ severity: "error", summary: "სურათი ძალიან დიდია. მაქსიმუმ 20MB", life: 3000 });
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.add({ severity: "error", summary: "სურათი ძალიან დიდია. მაქსიმუმ 5MB", life: 3000 });
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.add({ severity: "error", summary: `ფაილი ${file.name}" არ არის სურათი`, life: 3000 });
        return;
      }

      validFiles.push(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === validFiles.length) {
          imagePreviews.value = [...imagePreviews.value, ...newPreviews];
        }
      };
      reader.readAsDataURL(file);
    });

    selectedImages.value = [...selectedImages.value, ...validFiles];
  };

  const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const f of files) {
      const url = await uploadToImgBB(f);
      urls.push(url);
    }
    return urls;
  };

  const removeImage = (index: number) => {
    selectedImages.value.splice(index, 1);
    imagePreviews.value.splice(index, 1);
  };

  const removeExistingImage = (index: number) => {
    existingImageUrls.value.splice(index, 1);
  };

  const resetValues = () => {
    selectedImage.value = null;
    imagePreview.value = "";
    uploadingImage.value = false;
  };

  return {
    uploadImageIfExists,
    handleMultipleImagesSelect,
    handleImageSelect,
    uploadMultipleImages,
    removeImage,
    removeExistingImage,
    resetValues,

    selectedImages,
    selectedImage,
    imagePreview,
    imagePreviews,
    existingImageUrls,
    uploadingImage
  };
};
