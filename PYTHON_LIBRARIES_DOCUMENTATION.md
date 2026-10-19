# Python Libraries Documentation - Floorplan to 3D Project

## Project Overview
**Project Name**: Floorplan to 3D Converter  
**Technology Stack**: Python 3.11 + Flask Backend + Three.js Frontend  
**Primary Function**: Detect walls, doors, and windows from floorplan images using AI (Mask R-CNN) and convert to 3D models

---

## Core Dependencies

### 1. **TensorFlow** (`tensorflow==2.13.0`)
**Purpose**: Deep Learning Framework  
**Usage**: Powers the Mask R-CNN model for object detection

**Files Used In**:
- `mrcnn/model.py` - Mask R-CNN neural network implementation
- `mrcnn/utils.py` - TensorFlow utilities for data processing
- `server/main.py` - Model inference
- `models/mask_rcnn_model.py` - Model initialization

**Functions**:
```python
# Model prediction
model.detect(sample, verbose=0)  # Detect walls, doors, windows

# Image preprocessing
mold_image(image_arr, config)  # Normalize and prepare image for TF

# GPU/CPU configuration
tf.config.experimental.set_memory_growth()  # Memory management
```

**Why TensorFlow 2.13**: 
- Compatible with Python 3.11
- TensorFlow 2.14+ breaks Python 3.11 support
- Stable Mask R-CNN implementation

---

### 2. **Keras** (`keras==2.13.1`)
**Purpose**: High-level Neural Network API  
**Usage**: Simplifies TensorFlow model building and training

**Files Used In**:
- `mrcnn/model.py` - Model architecture definition
- `mrcnn/config.py` - Model configuration classes
- Training scripts (not included in production)

**Functions**:
```python
# Model layers
keras.layers.Conv2D()  # Convolutional layers
keras.layers.BatchNormalization()  # Normalization
keras.models.Model()  # Model construction
```

**Integration**: Keras is integrated with TensorFlow as `tf.keras`

---

### 3. **OpenCV** (`opencv-python==4.8.1.78`)
**Purpose**: Computer Vision and Image Processing  
**Usage**: Image manipulation, edge detection, contour finding, morphological operations

**Files Used In**:
- `server/mask_to_polygon_converter.py` - Convert detection masks to polygons
- `symbol_detector.py` - Template matching for symbols
- `image_processing/mask_processing.py` - Mask refinement
- `ocr_detector.py` - Image preprocessing for OCR
- `server/main.py` - Office plan detection (thin line enhancement)

**Key Functions**:
```python
# Contour detection
cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# Morphological operations
cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

# Edge detection
cv2.Canny(gray, 50, 150)

# Image preprocessing
cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
cv2.GaussianBlur(image, (5, 5), 0)
cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)

# Template matching
cv2.matchTemplate(image, template, cv2.TM_CCOEFF_NORMED)
```

**Critical Uses**:
- **Mask to Polygon Conversion**: Extracts precise polygon coordinates from AI detection masks
- **Office Plan Enhancement**: Thickens thin lines in architectural drawings
- **Contour Simplification**: Douglas-Peucker algorithm for polygon approximation

---

### 4. **NumPy** (`numpy==1.24.3`)
**Purpose**: Numerical Computing and Array Operations  
**Usage**: Image array manipulation, mathematical operations, data structures

**Files Used In**:
- **ALL Python files** - Universal data structure
- `image_processing/image_loader.py` - Image array processing
- `server/mask_to_polygon_converter.py` - Polygon calculations
- `analysis/wall_analysis.py` - Geometric calculations
- `utils/geometry.py` - Mathematical operations

**Key Functions**:
```python
# Array operations
np.array(image)  # Convert to numpy array
np.zeros((height, width))  # Create empty arrays
np.expand_dims(array, axis=0)  # Add batch dimension

# Mathematical operations
np.mean(), np.sum(), np.max(), np.min()
np.hypot(dx, dy)  # Distance calculations
np.arctan2(dy, dx)  # Angle calculations

# Boolean operations
mask > threshold  # Create binary masks
np.where(condition, x, y)  # Conditional selection
```

**Why Essential**: 
- TensorFlow and OpenCV both use NumPy arrays internally
- All image data is stored as NumPy arrays
- Efficient mathematical operations on large datasets

---

### 5. **Pillow (PIL)** (`Pillow==10.0.1`)
**Purpose**: Python Imaging Library  
**Usage**: Image loading, format conversion, basic manipulation

**Files Used In**:
- `server/main.py` - Load uploaded images
- `image_processing/image_loader.py` - Image reading and conversion
- `services/image_validation.py` - Image validation and resizing
- `server/mask_to_polygon_converter.py` - Image format conversion
- `visualization/wall_visualization.py` - Result visualization

**Key Functions**:
```python
# Image I/O
Image.open(file_path)  # Load image
Image.open(io.BytesIO(bytes))  # Load from bytes
pil_image.save(output_path)  # Save image

# Conversions
pil_image.convert('RGB')  # Convert to RGB
pil_image.resize((width, height))  # Resize
np.array(pil_image)  # Convert to numpy

# Drawing
ImageDraw.Draw(image)  # Create drawing context
draw.rectangle(bbox, outline='red')  # Draw boxes
draw.text((x, y), text, font=font)  # Add text
```

**Why Used**: 
- Better than OpenCV for initial image loading
- Handles various image formats (PNG, JPG, TIFF, WebP)
- Easy conversion between formats

---

### 6. **Flask** (`Flask==2.3.3`)
**Purpose**: Web Framework  
**Usage**: HTTP server for API endpoints and viewer hosting

**Files Used In**:
- `server/main.py` - Main application server

**Key Endpoints**:
```python
# Routes
@app.route('/')  # Serve viewer HTML
@app.route('/extract-image', methods=['POST'])  # Process images
@app.route('/extract', methods=['POST'])  # Process SVG files
@app.route('/demos/<path>')  # Serve demo files
@app.route('/healthz')  # Health check
```

**Functions**:
```python
Flask(__name__)  # Create app
jsonify(data)  # Return JSON response
request.files['image']  # Access uploaded files
send_from_directory(path, file)  # Serve static files
```

---

### 7. **Flask-CORS** (`Flask-Cors==4.0.0`)
**Purpose**: Cross-Origin Resource Sharing  
**Usage**: Allow frontend to communicate with backend

**Files Used In**:
- `server/main.py`

**Functions**:
```python
CORS(application, resources={r"/*": {"origins": app_config.CORS_ORIGINS}})
```

**Why Needed**: Enables the Three.js viewer to make API calls to Flask backend

---

### 8. **EasyOCR** (`easyocr==1.7.0`)
**Purpose**: Optical Character Recognition  
**Usage**: Detect room names and labels in floorplans

**Files Used In**:
- `ocr_detector.py` - Room name detection

**Key Functions**:
```python
# Initialize reader
reader = easyocr.Reader(['en', 'ko'], gpu=False)

# Detect text
results = reader.readtext(image)
# Returns: [(bbox, text, confidence), ...]

# Advanced detection
reader.readtext(image, 
    width_ths=0.2,
    height_ths=0.2,
    paragraph=False,
    detail=1
)
```

**Languages Supported**:
- English (en)
- Korean (ko)

**Use Cases**:
- Detect "BEDROOM", "KITCHEN", "OFFICE" labels
- Multi-language support for international floorplans
- Extract room dimensions and area labels

---

### 9. **scikit-image** (`scikit-image==0.21.0`)
**Purpose**: Image Processing Algorithms  
**Usage**: Advanced image analysis and segmentation

**Files Used In**:
- `image_processing/mask_processing.py`
- `analysis/wall_analysis.py`

**Key Functions**:
```python
from skimage import measure, morphology

# Region properties
measure.regionprops(labeled_mask)
# Returns area, bbox, centroid, etc.

# Morphological operations
morphology.remove_small_objects(mask, min_size=500)
morphology.binary_closing(mask)
```

**Advantages**: 
- More advanced than OpenCV for certain operations
- Better scientific computing integration

---

### 10. **imageio** (`imageio==2.31.5`)
**Purpose**: Image Reading and Writing  
**Usage**: Handle various image formats

**Files Used In**:
- `image_processing/image_loader.py`
- Backup image I/O when PIL fails

**Functions**:
```python
import imageio

# Read image
image = imageio.imread(filepath)

# Write image
imageio.imwrite(filepath, image_array)
```

---

### 11. **CairoSVG** (`cairosvg>=2.7`)
**Purpose**: SVG to Raster Conversion  
**Usage**: Convert SVG floorplans to PNG for processing

**Files Used In**:
- `server/main.py` - `/extract` endpoint
- `scripts/build_demos.py` - Demo generation
- `src/buildingcv/svg_render.py` - SVG rendering

**Key Functions**:
```python
import cairosvg

# SVG to PNG
png_bytes = cairosvg.svg2png(bytestring=svg_data)
pil_image = Image.open(io.BytesIO(png_bytes))

# SVG to other formats
cairosvg.svg2pdf(bytestring=svg_data)
cairosvg.svg2ps(bytestring=svg_data)
```

**Why Important**: 
- Architects often provide SVG floorplans
- Enables processing of vector drawings
- Maintains high quality during conversion

---

### 12. **SciPy** (`scipy==1.11.3`)
**Purpose**: Scientific Computing  
**Usage**: Advanced mathematical operations, optimization

**Files Used In**:
- `utils/geometry.py` - Geometric calculations
- `analysis/wall_analysis.py` - Distance calculations

**Key Functions**:
```python
from scipy.spatial import distance
from scipy.ndimage import morphology

# Distance calculations
distance.euclidean(point1, point2)
distance.cdist(points_a, points_b)

# Morphological operations
morphology.binary_fill_holes(mask)
```

---

### 13. **Matplotlib** (`matplotlib==3.7.2`)
**Purpose**: Plotting and Visualization  
**Usage**: Debug visualizations, result plotting

**Files Used In**:
- Development/debugging only
- Not used in production server

**Functions**:
```python
import matplotlib.pyplot as plt

# Display images
plt.imshow(image)
plt.show()

# Plot polygons
plt.plot(x_coords, y_coords)
```

---

### 14. **imgaug** (`imgaug==0.4.0`)
**Purpose**: Image Augmentation  
**Usage**: Data augmentation for model training

**Files Used In**:
- Training scripts (not in production)
- Used during model development

**Functions**:
```python
import imgaug.augmenters as iaa

# Augmentation pipeline
aug = iaa.Sequential([
    iaa.Fliplr(0.5),  # Flip horizontally
    iaa.Affine(rotate=(-10, 10)),  # Rotate
    iaa.GaussianBlur(sigma=(0, 1.0))  # Blur
])

augmented = aug(images=images)
```

---

### 15. **H5PY** (`h5py==3.9.0`)
**Purpose**: HDF5 File Format Support  
**Usage**: Load Mask R-CNN weights

**Files Used In**:
- `mrcnn/model.py` - Model weight loading
- `models/mask_rcnn_model.py`

**Functions**:
```python
import h5py

# Load weights
model.load_weights(weights_path, by_name=True)
# Internally uses h5py to read .h5 file
```

**File**: `mask_rcnn_weights.h5` (150+ MB)

---

### 16. **PyYAML** (`PyYAML==6.0.1`)
**Purpose**: YAML Configuration Files  
**Usage**: Load application configuration

**Files Used In**:
- `config/settings.py` - Configuration management
- `configs/default.yaml` - Default settings

**Functions**:
```python
import yaml

# Load config
with open('configs/default.yaml') as f:
    config = yaml.safe_load(f)
```

**Configuration Files**:
- `configs/default.yaml` - Model settings, paths, parameters

---

### 17. **Requests** (`requests==2.31.0`)
**Purpose**: HTTP Client Library  
**Usage**: External API calls (if needed)

**Files Used In**:
- Not actively used in current production
- Available for future extensions

---

### 18. **Cython** (`Cython==3.0.2`)
**Purpose**: C-Extensions for Python  
**Usage**: Speed up critical operations

**Files Used In**:
- `mrcnn/utils.py` - Contains Cython-compiled functions
- Required for Mask R-CNN performance

**Functions**: Compiled C code for:
- Non-maximum suppression (NMS)
- Region of Interest (ROI) operations
- Fast mathematical operations

---

### 19. **python-dateutil** (`python-dateutil==2.8.2`)
**Purpose**: Date and Time Utilities  
**Usage**: Timestamp generation for output files

**Files Used In**:
- `services/json_service.py` - Add timestamps to JSON output

**Functions**:
```python
from datetime import datetime

# Generate timestamp
timestamp = datetime.now().isoformat()
```

---

## Library Usage Summary by Function

### Image Loading and Preprocessing
```
Pillow → Load image file
NumPy → Convert to array
OpenCV → Preprocess (grayscale, blur, threshold)
scikit-image → Advanced processing
```

### AI Detection (Mask R-CNN)
```
TensorFlow + Keras → Neural network
NumPy → Data arrays
H5PY → Load weights
```

### Mask to Polygon Conversion
```
OpenCV → Find contours, approximate polygons
NumPy → Array operations
SciPy → Geometric calculations
```

### OCR Text Detection
```
EasyOCR → Detect text
OpenCV → Preprocess images
NumPy → Array manipulation
Pillow → Format conversion
```

### Web Server
```
Flask → HTTP server
Flask-CORS → Enable CORS
Werkzeug → WSGI utilities
```

### SVG Processing
```
CairoSVG → Convert SVG to PNG
Pillow → Load converted image
```

### Configuration and I/O
```
PyYAML → Load config files
imageio → Alternative image I/O
python-dateutil → Timestamps
```

---

## Installation Requirements

### Python Version
**Required**: Python 3.11  
**Why**: TensorFlow 2.13 compatibility

### Installation Command
```bash
pip install -r requirements.txt
```

### GPU Support (Optional)
```bash
# For GPU acceleration
pip install tensorflow-gpu==2.13.0
```

---

## Performance Optimizations

### CPU Optimizations
- **NumPy**: BLAS/LAPACK optimizations
- **OpenCV**: SSE/AVX instructions
- **TensorFlow**: CPU optimizations enabled

### Memory Management
- **Lazy Loading**: Models loaded once at startup
- **Garbage Collection**: Explicit cleanup after inference
- **Streaming**: Process images in chunks

---

## Common Issues and Solutions

### TensorFlow Version
**Problem**: TensorFlow 2.14+ breaks Python 3.11
**Solution**: Pin to TensorFlow 2.13.0

### OpenCV Compatibility
**Problem**: Missing library dependencies
**Solution**: Use `opencv-python-headless` for servers

### EasyOCR First Run
**Problem**: Downloads models on first use (slow)
**Solution**: Pre-download models or cache them

### CairoSVG Dependencies
**Problem**: Requires Cairo system library
**Solution**: 
- Windows: Install GTK runtime
- Linux: `apt-get install libcairo2-dev`
- macOS: `brew install cairo`

---

## Project Technical Architecture

```
User Upload (Image/SVG)
    ↓
Flask Server (server/main.py)
    ↓
Image Validation (Pillow + OpenCV)
    ↓
AI Detection (TensorFlow + Mask R-CNN)
    ↓
Mask Processing (OpenCV + NumPy)
    ↓
Polygon Extraction (OpenCV contours)
    ↓
OCR Detection (EasyOCR) [Optional]
    ↓
JSON Generation (services/json_service.py)
    ↓
Three.js Viewer (viewer/index.html)
    ↓
3D Model Display
```

---

## Total Dependencies Count
- **Core ML**: 3 (TensorFlow, Keras, H5PY)
- **Image Processing**: 5 (OpenCV, Pillow, scikit-image, imageio, imgaug)
- **OCR**: 1 (EasyOCR)
- **Scientific**: 3 (NumPy, SciPy, Matplotlib)
- **Web**: 3 (Flask, Flask-CORS, Werkzeug)
- **Utilities**: 5 (PyYAML, Requests, Cython, python-dateutil, CairoSVG)

**Total**: 20 Python libraries

---

## License Notes
- TensorFlow: Apache 2.0
- OpenCV: Apache 2.0
- EasyOCR: Apache 2.0
- Flask: BSD-3-Clause
- All others: Various open-source licenses

---

**Documentation Last Updated**: 2024
**Project Status**: Production Ready
