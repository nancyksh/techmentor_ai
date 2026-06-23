import qrcode

# Replace this with your actual Vercel/Render URL during submission!
project_url = "https://techmentor-ai.vercel.app" 

qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_L,
    box_size=10,
    border=4,
)
qr.add_data(project_url)
qr.make(fit=True)

img = qr.make_image(fill_color="black", back_color="white")
img.save("Submission_QR_Code.png")

print(f"✅ Successfully generated Submission_QR_Code.png for {project_url}")
