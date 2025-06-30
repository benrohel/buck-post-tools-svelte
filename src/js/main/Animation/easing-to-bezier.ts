// After Effects Easing to Bezier Converter
// Converts mathematical easing functions to AE temporal ease values

interface BezierPoint {
  x: number;
  y: number;
}

interface AETemporalEase {
  influence: number;
  speed: number;
}

interface AEKeyframe {
  time: number;
  value: number;
  inTemporalEase: AETemporalEase;
  outTemporalEase: AETemporalEase;
  inSpatialTangent?: BezierPoint;
  outSpatialTangent?: BezierPoint;
}

interface EasingToBezier {
  inInfluence: number;
  outInfluence: number;
  inSpeed: number;
  outSpeed: number;
}

// Easing function type
type EasingFunction = (x: number) => number;

class EasingToAEConverter {
  
  /**
   * Convert an easing function to After Effects temporal ease values
   */
  static easingToTemporalEase(easingFunc: EasingFunction, easingName: string): EasingToBezier {
    // Sample the easing function to analyze its behavior
    const samples = 100;
    const points: BezierPoint[] = [];
    
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      points.push({ x: t, y: easingFunc(t) });
    }
    
    // Calculate derivatives at start and end points
    const startDerivative = this.calculateDerivative(points, 0);
    const endDerivative = this.calculateDerivative(points, samples);
    
    // Convert derivatives to AE influence and speed values
    return this.derivativesToAEValues(startDerivative, endDerivative, easingName);
  }
  
  /**
   * Calculate derivative at a specific point
   */
  private static calculateDerivative(points: BezierPoint[], index: number): number {
    if (index === 0) {
      // Forward difference for start point
      return (points[1].y - points[0].y) / (points[1].x - points[0].x);
    } else if (index === points.length - 1) {
      // Backward difference for end point
      return (points[index].y - points[index - 1].y) / (points[index].x - points[index - 1].x);
    } else {
      // Central difference for middle points
      return (points[index + 1].y - points[index - 1].y) / (points[index + 1].x - points[index - 1].x);
    }
  }
  
  /**
   * Convert derivatives to After Effects influence and speed values
   */
  private static derivativesToAEValues(startDerivative: number, endDerivative: number, easingName: string): EasingToBezier {
    // Base conversion - these values work well for most easing functions
    let inInfluence = Math.min(Math.max(Math.abs(startDerivative) * 33.33, 16.67), 83.33);
    let outInfluence = Math.min(Math.max(Math.abs(endDerivative) * 33.33, 16.67), 83.33);
    let inSpeed = Math.min(Math.max(startDerivative * 100, 0.1), 300);
    let outSpeed = Math.min(Math.max(endDerivative * 100, 0.1), 300);
    
    // Fine-tune based on specific easing types
    switch (true) {
      case easingName.includes('Elastic'):
        inInfluence = Math.min(inInfluence * 1.5, 95);
        outInfluence = Math.min(outInfluence * 1.5, 95);
        break;
        
      case easingName.includes('Back'):
        inInfluence = Math.min(inInfluence * 1.2, 90);
        outInfluence = Math.min(outInfluence * 1.2, 90);
        break;
        
      case easingName.includes('Bounce'):
        // Bounce requires special handling - use keyframe segments
        inInfluence = 75;
        outInfluence = 75;
        break;
        
      case easingName.includes('Expo'):
        if (easingName.includes('In')) inSpeed *= 0.3;
        if (easingName.includes('Out')) outSpeed *= 3;
        break;
        
      case easingName === 'linear':
        inInfluence = outInfluence = 16.67; // Linear interpolation
        inSpeed = outSpeed = 100;
        break;
    }
    
    return { inInfluence, outInfluence, inSpeed, outSpeed };
  }
  
  /**
   * Generate After Effects ExtendScript code to apply easing
   */
  static generateAEScript(easingName: string, easingFunc: EasingFunction): string {
    const bezierValues = this.easingToTemporalEase(easingFunc, easingName);
    
    return `
// Apply ${easingName} easing to selected keyframes
function apply${easingName}Easing() {
    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) {
        alert("Please select a composition");
        return "No composition selected";
    }
    
    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length === 0) {
        alert("Please select at least one layer");
        return "No layers selected";
    }
    
    app.beginUndoGroup("Apply ${easingName} Easing");
    
    var appliedCount = 0;
    
    try {
        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];
            var selectedProps = layer.selectedProperties;
            
            if (selectedProps.length === 0) {
                // If no properties selected, apply to transform properties with keyframes
                if (layer.transform.position.numKeys > 1) {
                    applyEasingToProperty(layer.transform.position);
                    appliedCount++;
                }
                if (layer.transform.scale.numKeys > 1) {
                    applyEasingToProperty(layer.transform.scale);
                    appliedCount++;
                }
                if (layer.transform.rotation.numKeys > 1) {
                    applyEasingToProperty(layer.transform.rotation);
                    appliedCount++;
                }
                if (layer.transform.opacity.numKeys > 1) {
                    applyEasingToProperty(layer.transform.opacity);
                    appliedCount++;
                }
            } else {
                for (var j = 0; j < selectedProps.length; j++) {
                    var prop = selectedProps[j];
                    if (applyEasingToProperty(prop)) {
                        appliedCount++;
                    }
                }
            }
        }
        
        app.endUndoGroup();
        
        if (appliedCount > 0) {
            return "Applied ${easingName} to " + appliedCount + " properties";
        } else {
            return "No keyframes found to apply easing";
        }
        
    } catch (e) {
        app.endUndoGroup();
        return "Error applying easing: " + e.toString();
    }
    
    function applyEasingToProperty(property) {
        if (!property || !property.canVaryOverTime || property.numKeys < 2) {
            return false;
        }
        
        try {
            for (var k = 1; k <= property.numKeys; k++) {
                // Set interpolation type to Bezier
                property.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
                
                // Create temporal ease objects
                var easeIn = new KeyframeEase(0, ${bezierValues.inInfluence});
                var easeOut = new KeyframeEase(0, ${bezierValues.outInfluence});
                
                // Determine number of dimensions based on property type
                var inEases = [];
                var outEases = [];
                
                // Check if property has multiple dimensions
                try {
                    var testValue = property.valueAtTime(property.keyTime(k), false);
                    var dimensions = 1;
                    
                    if (testValue && typeof testValue === "object" && testValue.length) {
                        dimensions = testValue.length;
                    }
                    
                    // Create ease arrays for each dimension
                    for (var d = 0; d < dimensions; d++) {
                        inEases.push(new KeyframeEase(0, ${bezierValues.inInfluence}));
                        outEases.push(new KeyframeEase(0, ${bezierValues.outInfluence}));
                    }
                    
                    // Apply temporal ease
                    property.setTemporalEaseAtKey(k, inEases, outEases);
                    
                } catch (dimensionError) {
                    // Fallback for single dimension properties
                    property.setTemporalEaseAtKey(k, [easeIn], [easeOut]);
                }
            }
            return true;
        } catch (propertyError) {
            // Skip problematic properties
            return false;
        }
    }
}

// Execute the function
apply${easingName}Easing();`;
  }
  
  /**
   * Generate complex easing with multiple keyframes (for bounce, elastic, etc.)
   */
  static generateComplexEasing(easingName: string, easingFunc: EasingFunction, startValue: number = 0, endValue: number = 100, duration: number = 1): AEKeyframe[] {
    const keyframes: AEKeyframe[] = [];
    
    if (easingName.includes('Bounce') || easingName.includes('Elastic')) {
      // For complex easings, create multiple keyframes
      const segments = easingName.includes('Bounce') ? 20 : 30;
      
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const easedT = easingFunc(t);
        const value = startValue + (endValue - startValue) * easedT;
        
        // Calculate temporal ease for this segment
        const nextT = Math.min((i + 1) / segments, 1);
        const prevT = Math.max((i - 1) / segments, 0);
        const nextEased = easingFunc(nextT);
        const prevEased = easingFunc(prevT);
        
        const outSpeed = (nextEased - easedT) / (nextT - t) * 100;
        const inSpeed = (easedT - prevEased) / (t - prevT) * 100;
        
        keyframes.push({
          time: t * duration,
          value: value,
          inTemporalEase: { influence: 33, speed: Math.abs(inSpeed) },
          outTemporalEase: { influence: 33, speed: Math.abs(outSpeed) }
        });
      }
    } else {
      // For simple easings, use just start and end keyframes
      const bezierValues = this.easingToTemporalEase(easingFunc, easingName);
      
      keyframes.push(
        {
          time: 0,
          value: startValue,
          inTemporalEase: { influence: 16.67, speed: 0 },
          outTemporalEase: { influence: bezierValues.outInfluence, speed: bezierValues.outSpeed }
        },
        {
          time: duration,
          value: endValue,
          inTemporalEase: { influence: bezierValues.inInfluence, speed: bezierValues.inSpeed },
          outTemporalEase: { influence: 16.67, speed: 0 }
        }
      );
    }
    
    return keyframes;
  }
  
  /**
   * Convert to CSS cubic-bezier notation
   */
  static toCSSCubicBezier(easingFunc: EasingFunction): string {
    // Sample the easing function and fit to cubic bezier
    const p1 = this.findBezierControlPoint(easingFunc, 0.25);
    const p2 = this.findBezierControlPoint(easingFunc, 0.75);
    
    return `cubic-bezier(${p1.x.toFixed(3)}, ${p1.y.toFixed(3)}, ${p2.x.toFixed(3)}, ${p2.y.toFixed(3)})`;
  }
  
  /**
   * Find control point for cubic bezier approximation
   */
  private static findBezierControlPoint(easingFunc: EasingFunction, t: number): BezierPoint {
    const y = easingFunc(t);
    const derivative = this.calculateNumericalDerivative(easingFunc, t);
    
    // Convert derivative to control point
    const controlX = t + (derivative * 0.1);
    const controlY = y + (derivative * 0.1);
    
    return {
      x: Math.max(0, Math.min(1, controlX)),
      y: Math.max(0, Math.min(1, controlY))
    };
  }
  
  /**
   * Calculate numerical derivative
   */
  private static calculateNumericalDerivative(func: EasingFunction, x: number, h: number = 0.001): number {
    return (func(x + h) - func(x - h)) / (2 * h);
  }
}

// Example usage and predefined conversions
const easingConversions = {
  // Standard easings with their AE equivalents
  linear: { influence: 16.67, speed: 100 },
  easeInQuad: { inInfluence: 75, outInfluence: 16.67, inSpeed: 0, outSpeed: 200 },
  easeOutQuad: { inInfluence: 16.67, outInfluence: 75, inSpeed: 200, outSpeed: 0 },
  easeInOutQuad: { inInfluence: 75, outInfluence: 75, inSpeed: 0, outSpeed: 0 },
  
  easeInCubic: { inInfluence: 83, outInfluence: 16.67, inSpeed: 0, outSpeed: 300 },
  easeOutCubic: { inInfluence: 16.67, outInfluence: 83, inSpeed: 300, outSpeed: 0 },
  easeInOutCubic: { inInfluence: 83, outInfluence: 83, inSpeed: 0, outSpeed: 0 },
  
  easeInBack: { inInfluence: 95, outInfluence: 16.67, inSpeed: -50, outSpeed: 150 },
  easeOutBack: { inInfluence: 16.67, outInfluence: 95, inSpeed: 150, outSpeed: -50 },
  easeInOutBack: { inInfluence: 95, outInfluence: 95, inSpeed: -30, outSpeed: -30 }
};

// Export for use in CEP panel
export { EasingToAEConverter, easingConversions, type AEKeyframe, type EasingToBezier };