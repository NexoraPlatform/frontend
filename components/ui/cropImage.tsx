export const getCroppedImg = (imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number; }): Promise<string> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous'; // ca să eviti CORS error daca e nevoie
        image.src = imageSrc;
        image.onload = () => {
            const canvas = document.createElement('canvas');
            // dimensiune canvas pătrat - crop width și height trebuie să fie egale
            const size = Math.min(pixelCrop.width, pixelCrop.height);
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                // Clear canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Masca circulara - cerc
                ctx.save();
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
                ctx.closePath();
                ctx.clip();

                // Deseneaza crop-ul imaginei
                ctx.drawImage(
                    image,
                    pixelCrop.x,
                    pixelCrop.y,
                    size,
                    size,
                    0,
                    0,
                    size,
                    size
                );

                ctx.restore();

                // Exporta ca dataURL cu fundal transparent (PNG)
                resolve(canvas.toDataURL('image/png'));
            } else {
                reject(new Error('Canvas context not found'));
            }
        };
        image.onerror = () => reject(new Error('Failed to load image'));
    });
};
