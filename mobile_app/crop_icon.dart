import 'dart:io';
import 'dart:math';
import 'package:image/image.dart' as img;

void main() {
  final paths = ['assets/logo_bgclean.png', 'assets/logo.jpg'];
  String? foundPath;
  for (var p in paths) {
    if (File(p).existsSync()) {
      foundPath = p;
      break;
    }
  }
  
  if (foundPath == null) {
    print('No logo file found');
    return;
  }
  
  final file = File(foundPath);
  final image = img.decodeImage(file.readAsBytesSync());
  if (image == null) return;
  
  int minX = image.width;
  int minY = image.height;
  int maxX = 0;
  int maxY = 0;
  
  final bgColor = image.getPixel(0, 0);
  
  for (int y = 0; y < image.height; y++) {
    for (int x = 0; x < image.width; x++) {
      final p = image.getPixel(x, y);
      bool isBg = false;
      
      // Simple transparent check or approximate color match
      if (p.a == 0) {
        isBg = true;
      } else if (p.a == bgColor.a && 
          (p.r - bgColor.r).abs() < 5 && 
          (p.g - bgColor.g).abs() < 5 && 
          (p.b - bgColor.b).abs() < 5) {
        isBg = true;
      }
      
      if (!isBg) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  if (minX <= maxX && minY <= maxY) {
    int w = maxX - minX + 1;
    int h = maxY - minY + 1;
    print('Bounding box: ($minX, $minY) to ($maxX, $maxY), size: ${w}x${h}');
    
    final cropped = img.copyCrop(image, x: minX, y: minY, width: w, height: h);
    
    int size = max(w, h);
    int pad = (size * 0.06).toInt();
    int newSize = size + pad * 2;
    
    final squared = img.Image(width: newSize, height: newSize);
    img.fill(squared, color: img.ColorRgba8(0, 0, 0, 0)); // transparent background
    
    // Calculate normal center offset
    int offsetX = (newSize - w) ~/ 2;
    // Shift left by 4% of the width to visually center the circular part of the wave
    offsetX -= (size * 0.04).toInt(); 
    
    int offsetY = (newSize - h) ~/ 2;
    img.compositeImage(squared, cropped, dstX: offsetX, dstY: offsetY);
    
    final finalImage = img.copyResize(squared, width: 1024, height: 1024, interpolation: img.Interpolation.cubic);
    
    final outBytes = img.encodePng(finalImage);
    File('assets/logo_full.png').writeAsBytesSync(outBytes);
    print('Saved assets/logo_full.png');
  } else {
    print('No foreground pixels found');
  }
}
