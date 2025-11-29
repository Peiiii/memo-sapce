import React from 'react';
import { useSphereStore } from '../../stores/sphereStore';

export const VisualSphere: React.FC = () => {
  const { sphereRadius } = useSphereStore();
  
  // Create faint rings to visualize the sphere structure
  // This helps the user understand the rotation better
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transform-style-3d">
       {/* Central glowing core */}
       <div 
         className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl"
         style={{ width: sphereRadius * 1.5, height: sphereRadius * 1.5 }}
       />
       <div 
         className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-xl"
         style={{ width: sphereRadius * 0.5, height: sphereRadius * 0.5 }}
       />
       
       {/* Equatorial Ring (XY Plane) */}
       <div 
         className="absolute border border-indigo-300/10 rounded-full"
         style={{ 
           width: sphereRadius * 2, 
           height: sphereRadius * 2,
           left: -sphereRadius,
           top: -sphereRadius
         }}
       />

       {/* Meridian Ring 1 (XZ Plane) - Rotated 90 deg around X */}
       <div 
         className="absolute border border-indigo-300/10 rounded-full"
         style={{ 
           width: sphereRadius * 2, 
           height: sphereRadius * 2,
           left: -sphereRadius,
           top: -sphereRadius,
           transform: 'rotateX(90deg)'
         }}
       />

       {/* Meridian Ring 2 (YZ Plane) - Rotated 90 deg around Y */}
       <div 
         className="absolute border border-indigo-300/10 rounded-full"
         style={{ 
           width: sphereRadius * 2, 
           height: sphereRadius * 2,
           left: -sphereRadius,
           top: -sphereRadius,
           transform: 'rotateY(90deg)'
         }}
       />
       
       {/* Inner Dashed Ring for style */}
       <div 
         className="absolute border border-dashed border-white/5 rounded-full"
         style={{ 
           width: sphereRadius * 1.4, 
           height: sphereRadius * 1.4,
           left: -sphereRadius * 0.7,
           top: -sphereRadius * 0.7,
           transform: 'rotateX(45deg) rotateY(45deg)'
         }}
       />
    </div>
  );
};