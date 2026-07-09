import os
from PIL import Image, ImageDraw, ImageFont

# Set output directory
output_dir = 'Docs/logos'
os.makedirs(output_dir, exist_ok=True)

# Find font path
font_paths = [
    '/usr/share/fonts/truetype/ubuntu/Ubuntu-B.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf'
]

font_path = None
for p in font_paths:
    if os.path.exists(p):
        font_path = p
        break

def create_logo(name, filename, bg_color, fg_color):
    img = Image.new('RGB', (300, 300), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Try to load font
    font = None
    if font_path:
        try:
            font = ImageFont.truetype(font_path, 36)
        except Exception:
            font = ImageFont.load_default()
    else:
        font = ImageFont.load_default()
        
    # Draw simple emblem or shapes
    if name == 'Next.js':
        # Draw a sleek 'N'
        draw.ellipse([60, 60, 240, 240], outline=fg_color, width=8)
        # We can draw the text 'N' in the center
        font_large = ImageFont.truetype(font_path, 90) if font_path else font
        draw.text((115, 80), 'N', fill=fg_color, font=font_large)
        # Small name at the bottom
        draw.text((85, 205), 'Next.js 15', fill=fg_color, font=font)
        
    elif name == 'Prisma':
        # Triangle prisma shape
        draw.polygon([(150, 60), (240, 210), (60, 210)], fill=fg_color)
        draw.polygon([(150, 90), (220, 200), (80, 200)], fill=bg_color)
        draw.text((95, 220), 'Prisma', fill=fg_color, font=font)
        
    elif name == 'Supabase':
        # Lightning shape
        draw.polygon([(160, 60), (220, 150), (140, 150), (180, 240), (100, 140), (150, 140)], fill=fg_color)
        draw.text((70, 230), 'Supabase', fill=fg_color, font=font)
        
    elif name == 'PostgreSQL':
        # Database cylinder
        draw.ellipse([80, 70, 220, 130], outline=fg_color, width=6)
        draw.line([80, 100, 80, 200], fill=fg_color, width=6)
        draw.line([220, 100, 220, 200], fill=fg_color, width=6)
        draw.ellipse([80, 120, 220, 180], outline=fg_color, width=6)
        draw.ellipse([80, 170, 220, 230], outline=fg_color, width=6)
        draw.text((55, 235), 'PostgreSQL', fill=fg_color, font=font)
        
    elif name == 'TypeScript':
        # Square TS logo
        draw.rectangle([50, 50, 250, 250], outline=fg_color, width=8)
        font_large = ImageFont.truetype(font_path, 80) if font_path else font
        draw.text((120, 100), 'TS', fill=fg_color, font=font_large)
        draw.text((60, 205), 'TypeScript', fill=fg_color, font=font)

    else:
        # Generic text logo
        draw.rectangle([20, 20, 280, 280], outline=fg_color, width=4)
        draw.text((50, 130), name, fill=fg_color, font=font)

    img.save(os.path.join(output_dir, filename))
    print(f"Created logo: {filename}")

# Generate all logos
create_logo('Next.js', 'nextjs.png', (0, 0, 0), (255, 255, 255))
create_logo('Prisma', 'prisma.png', (12, 52, 75), (255, 255, 255))
create_logo('Supabase', 'supabase.png', (28, 28, 28), (62, 207, 142))
create_logo('PostgreSQL', 'postgresql.png', (51, 103, 145), (255, 255, 255))
create_logo('TypeScript', 'typescript.png', (49, 120, 198), (255, 255, 255))
