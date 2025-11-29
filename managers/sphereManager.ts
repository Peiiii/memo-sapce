import { motionValue, MotionValue } from 'framer-motion';
import { useSphereStore } from '../stores/sphereStore';
import { useCommonStore } from '../stores/commonStore';
import { Memory, OrbLayout } from '../types';

// Simple Quaternion implementation
class Quaternion {
  constructor(public x: number, public y: number, public z: number, public w: number) {}

  static identity() { return new Quaternion(0, 0, 0, 1); }

  multiply(q: Quaternion) {
    const x = this.x * q.w + this.y * q.z - this.z * q.y + this.w * q.x;
    const y = -this.x * q.z + this.y * q.w + this.z * q.x + this.w * q.y;
    const z = this.x * q.y - this.y * q.x + this.z * q.w + this.w * q.z;
    const w = -this.x * q.x - this.y * q.y - this.z * q.z + this.w * q.w;
    return new Quaternion(x, y, z, w);
  }
  
  normalize() {
    const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    if (len === 0) return Quaternion.identity();
    return new Quaternion(this.x / len, this.y / len, this.z / len, this.w / len);
  }

  static fromAxisAngle(axis: { x: number; y: number; z: number }, angle: number) {
    const halfAngle = angle / 2;
    const s = Math.sin(halfAngle);
    return new Quaternion(axis.x * s, axis.y * s, axis.z * s, Math.cos(halfAngle));
  }

  // Returns column-major matrix array (compatible with CSS matrix3d and OpenGL)
  toMatrix4() {
    const { x, y, z, w } = this;
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;
    
    return [
      1 - (yy + zz), xy + wz, xz - wy, 0,
      xy - wz, 1 - (xx + zz), yz + wx, 0,
      xz + wy, yz - wx, 1 - (xx + yy), 0,
      0, 0, 0, 1
    ];
  }
}

export class SphereManager {
  public sphereScale: MotionValue<number>;
  
  // Transformation Matrices
  public transformMatrix: MotionValue<string>;
  public transformMatrixRaw: MotionValue<number[]>;
  public inverseMatrix: MotionValue<string>;

  private currentQ: Quaternion = Quaternion.identity();
  private unsubMemories?: () => void;

  constructor() {
    this.sphereScale = motionValue(1.8);
    
    const identityMat = Quaternion.identity().toMatrix4();
    this.transformMatrixRaw = motionValue(identityMat);
    this.transformMatrix = motionValue(`matrix3d(${identityMat.join(',')})`);
    this.inverseMatrix = motionValue(`matrix3d(${identityMat.join(',')})`);
  }

  init = () => {
    this.handleResize();
    // Subscribe to memory changes to update radius based on count
    this.unsubMemories = useCommonStore.subscribe(
      (state) => state.memories,
      () => this.handleResize()
    );
  };

  dispose = () => {
    if (this.unsubMemories) this.unsubMemories();
  };

  handleResize = () => {
    const memories = useCommonStore.getState().memories;
    const count = Math.max(1, memories.length);
    const calculatedRadius = 45 * Math.sqrt(count);
    useSphereStore.getState().setSphereRadius(Math.max(200, calculatedRadius));
  };

  resetRotation = () => {
    this.currentQ = Quaternion.identity();
    this.updateMotionValues();
  };

  toggleGravityMode = () => {
    useSphereStore.getState().setIsGravityMode(prev => !prev);
  };

  handleDrag = (deltaX: number, deltaY: number) => {
    // Trackball Rotation Logic
    // Apply rotation around an axis perpendicular to the drag direction.
    // Screen Space: Drag Right (+X) -> Rotate around +Y Axis.
    // Screen Space: Drag Down (+Y) -> Rotate around +X Axis.
    
    // Axis Construction: (-deltaY, deltaX, 0)
    // Actually, simple mapping:
    // Drag X controls rotation around Y axis.
    // Drag Y controls rotation around X axis.
    
    // Calculate magnitude for angle
    const sensitivity = 0.005; 
    const angle = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * sensitivity;
    if (angle < 0.00001) return;

    // Axis of rotation (normalized)
    // We rotate around the axis perpendicular to the mouse movement in the screen plane.
    // Vector Mouse = (dx, dy). Perpendicular = (dy, -dx).
    // Let's verify: 
    // If move right (dx > 0, dy = 0), axis is (0, -1, 0). 
    // Standard "turn right" is rotating around +Y (0,1,0). 
    // So let's flip signs to match natural feel.
    // Axis: (deltaY, -deltaX, 0).
    const axis = { x: deltaY, y: -deltaX, z: 0 };
    const len = Math.sqrt(axis.x**2 + axis.y**2);
    axis.x /= len;
    axis.y /= len;

    const deltaQ = Quaternion.fromAxisAngle(axis, angle);
    
    // Apply rotation in World Space (Pre-multiply)
    // newRotation = deltaRotation * currentRotation
    this.currentQ = deltaQ.multiply(this.currentQ).normalize();
    
    this.updateMotionValues();
  };

  handleZoom = (delta: number) => {
    const current = this.sphereScale.get();
    const newScale = Math.max(0.2, Math.min(5, current - delta * 0.001));
    this.sphereScale.set(newScale);
  };
  
  // Calculate the spherical coordinates (theta, phi) corresponding to the point
  // on the sphere that is currently facing the viewer (World Space Z+ or similar depending on setup).
  getCenterCoordinates = () => {
    // We want the point on the sphere that maps to (0,0,1) in view space.
    // P_local = Inverse(ModelMatrix) * (0,0,1)
    // Since Inverse = Transpose for rotation, P_local is the 3rd row of the rotation matrix.
    const m = this.transformMatrixRaw.get();
    // Indices: m[2], m[6], m[10] are the elements of the 3rd row (0-based flat array is column-major)
    // Col 1: 0,1,2,3. Col 2: 4,5,6,7. Col 3: 8,9,10,11.
    // Matrix:
    // [0  4  8  12]
    // [1  5  9  13]
    // [2  6  10 14]
    // [3  7  11 15]
    // We want the vector that became the Z axis. That corresponds to the 3rd row of the rotation matrix?
    // Actually, M * Z_local = Z_world.
    // We want P_local such that M * P_local = Z_world (0,0,1).
    // So P_local = M_transpose * (0,0,1).
    // Vector (0,0,1) picks the 3rd column of M_transpose, which is the 3rd row of M.
    // So yes: x=m[2], y=m[6], z=m[10].
    
    const x = m[2];
    const y = m[6];
    const z = m[10];
    
    // Convert Cartesian (normalized on unit sphere) to Spherical (phi, theta)
    // My layout uses: y = cos(phi), x = sin(phi)cos(theta), z = sin(phi)sin(theta)
    const clampedY = Math.max(-1, Math.min(1, y));
    const phi = Math.acos(clampedY);
    const theta = Math.atan2(z, x);

    return { theta, phi };
  };

  getLayout(
    memory: Memory, 
    radius: number, 
    isHovered: boolean, 
    isDragging: boolean
  ): OrbLayout {
    const x = radius * Math.sin(memory.phi) * Math.cos(memory.theta);
    const y = radius * Math.cos(memory.phi);
    const z = radius * Math.sin(memory.phi) * Math.sin(memory.theta);

    const BASE_SCALE = memory.scale;
    const HOVER_SCALE_MULTIPLIER = 1.4; 
    const activeScale = (isHovered || isDragging) ? BASE_SCALE * HOVER_SCALE_MULTIPLIER : BASE_SCALE;

    return {
      x,
      y,
      z,
      rotateX: 0,
      rotateY: 0,
      scale: activeScale,
      opacity: 1,
      zIndex: Math.floor(z) + 2000,
      blur: 0,
      isActive: false
    };
  }

  private updateMotionValues() {
    const mat = this.currentQ.toMatrix4();
    this.transformMatrixRaw.set(mat);
    this.transformMatrix.set(`matrix3d(${mat.join(',')})`);
    
    // Inverse matrix for billboarding (transpose of rotation part)
    // Transpose 3x3 rotation, keep translation 0
    const inv = [
      mat[0], mat[4], mat[8], 0,
      mat[1], mat[5], mat[9], 0,
      mat[2], mat[6], mat[10], 0,
      0, 0, 0, 1
    ];
    this.inverseMatrix.set(`matrix3d(${inv.join(',')})`);
  }
}