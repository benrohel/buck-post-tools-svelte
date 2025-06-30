// After Effects Expression Converter
// Converts easing functions to AE expressions using built-in interpolation functions

interface ExpressionMapping {
  expression: string;
  description: string;
  useBuiltIn: boolean;
  category: 'builtin' | 'custom' | 'complex';
}

class EasingToExpressionConverter {
  
  /**
   * Get the appropriate AE expression for an easing function
   */
  static getExpression(easingName: string, startValue?: number, endValue?: number, duration?: number): ExpressionMapping {
    const expressions = this.getExpressionMappings();
    
    if (expressions[easingName]) {
      let expr = expressions[easingName].expression;
      
      // Replace placeholders if custom values provided
      if (startValue !== undefined && endValue !== undefined && duration !== undefined) {
        expr = expr
          .replace(/startValue/g, startValue.toString())
          .replace(/endValue/g, endValue.toString())
          .replace(/duration/g, duration.toString());
      }
      
      return {
        ...expressions[easingName],
        expression: expr
      };
    }
    
    // Fallback to linear if easing not found
    return {
      expression: 'linear(t, value1, value2)',
      description: 'Linear interpolation (fallback)',
      useBuiltIn: true,
      category: 'builtin'
    };
  }
  
  /**
   * All easing function to AE expression mappings
   */
  private static getExpressionMappings(): Record<string, ExpressionMapping> {
    return {
      // Built-in AE interpolation functions
      linear: {
        expression: 'linear(t, value1, value2)',
        description: 'Uses AE built-in linear interpolation',
        useBuiltIn: true,
        category: 'builtin'
      },
      
      easeInQuad: {
        expression: `// Quadratic ease in
t = time / thisComp.duration;
if (t <= 0) value1;
else if (t >= 1) value2;
else value1 + (value2 - value1) * ease(t, 0, 1) * ease(t, 0, 1);`,
        description: 'Quadratic acceleration using AE ease() function',
        useBuiltIn: true,
        category: 'builtin'
      },
      
      easeOutQuad: {
        expression: `// Quadratic ease out
t = time / thisComp.duration;
if (t <= 0) value1;
else if (t >= 1) value2;
else {
  easedT = 1 - (1 - ease(t, 0, 1)) * (1 - ease(t, 0, 1));
  value1 + (value2 - value1) * easedT;
}`,
        description: 'Quadratic deceleration using AE ease() function',
        useBuiltIn: true,
        category: 'builtin'
      },
      
      easeInOutQuad: {
        expression: `// Quadratic ease in-out
t = time / thisComp.duration;
if (t <= 0) value1;
else if (t >= 1) value2;
else {
  easedT = ease(t, 0, 1);
  value1 + (value2 - value1) * easedT;
}`,
        description: 'Uses AE built-in ease() function (closest to easeInOutQuad)',
        useBuiltIn: true,
        category: 'builtin'
      },
      
      // Custom expressions for precise control
      easeInCubic: {
        expression: `// Cubic ease in
t = time / thisComp.duration;
if (t <= 0) value1;
else if (t >= 1) value2;
else value1 + (value2 - value1) * t * t * t;`,
        description: 'Cubic acceleration curve',
        useBuiltIn: false,
        category: 'custom'
      },
      
      easeOutCubic: {
        expression: `// Cubic ease out
t = time / thisComp.duration;
if (t <= 0) value1;
else if (t >= 1) value2;
else {
  easedT = 1 - Math.pow(1 - t, 3);
  value1 + (value2 - value1) * easedT;
}`,
        description: 'Cubic deceleration curve',
        useBuiltIn: false,
        category: 'custom'
      },
      
      easeInOutCubic: {
        expression: `// Cubic ease in-out
t = time / thisComp.duration;
if (t <= 0) value1;
else if (t >= 1) value2;
else {
  easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  value1 + (value2 - value1) * easedT;
}`,
        description: 'Smooth cubic ease in and out',
        useBuiltIn: false,
        category: 'custom'
      },
      
      easeInSine: {
        expression: `// Sine ease in
t = time / thisComp.duration;
if (t <= 0) value1;
else if (t >= 1) value2;
else {
  easedT = 1 - Math.cos((t * Math.PI) / 2);
  value1 + (value2 - value1) * easedT;
}`,
        description: 'Gentle sine-based acceleration',
        useBuiltIn: false,
        category: 'custom'
      },
      
      easeOutSine: {
        expression: `// Sine ease out
t = time / thisComp.duration;
if (t <= 0) value1;
else if (t >= 1) value2;
else {
  easedT = Math.sin((t * Math.PI) / 2);
  value1 + (value2 - value1) * easedT;
}`,
        description: 'Gentle sine-based deceleration',
        useBuiltIn: false,
        category: 'custom'
      },
      
      easeInOutSine: {
        expression: `// Sine ease in-out
t = time / thisComp.duration;
if (t <= 0) value1;
else if (t >= 1) value2;
else {
  easedT = -(Math.cos(Math.PI * t) - 1) / 2;
  value1 + (value2 - value1) * easedT;
}`,
        description: 'Very smooth sine-based ease in and out',
        useBuiltIn: false,
        category: 'custom'
      },
      
      easeInExpo: {
        expression: `// Exponential ease in
t = time / thisComp.duration;
if (t <= 0) value1;
else if (t >= 1) value2;
else {
  easedT = t === 0 ? 0 : Math.pow(2, 10 * (t - 1));
  value1 + (value2 - value1) * easedT;
}`,
        description: 'Exponential acceleration',
        useBuiltIn: false,
        category: 'custom'
      },
      
      easeOutExpo: {
        expression: `// Exponential ease out
t = time / thisComp.duration;
if (t <= 0) value1;
else if (t >= 1) value2;
else {
  easedT = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  value1 + (value2 - value1) * easedT;
}`,
        description: 'Exponential deceleration',
        useBuiltIn: false,
        category: 'custom'
      },
      
      easeInBack: {
        expression: `// Back ease in (overshoot)
t = time / thisComp.duration;
if (t <= 0) value1;
else if (t >= 1) value2;
else {
  c1 = 1.70158;
  c3 = c1 + 1;
  easedT = c3 * t * t * t - c1 * t * t;
  value1 + (value2 - value1) * easedT;
}`,
        description: 'Backs up before moving forward',
        useBuiltIn: false,
        category: 'custom'
      },
      
      easeOutBack: {
        expression: `// Back ease out (overshoot)
t = time / thisComp.duration;
if (t <= 0) value1;
else if (t >= 1) value2;
else {
  c1 = 1.70158;
  c3 = c1 + 1;
  easedT = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  value1 + (value2 - value1) * easedT;
}`,
        description: 'Overshoots then settles back',
        useBuiltIn: false,
        category: 'custom'
      },
      
      easeInOutBack: {
        expression: `// Back ease in-out (overshoot both ends)
t = time / thisComp.duration;
if (t <= 0) value1;
else if (t >= 1) value2;
else {
  c1 = 1.70158;
  c2 = c1 * 1.525;
  easedT = t < 0.5
    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  value1 + (value2 - value1) * easedT;
}`,
        description: 'Backs up and overshoots at both ends',
        useBuiltIn: false,
        category: 'custom'
      },
      
      // Complex expressions using AE's built-in functions where possible
      easeInElastic: {
        expression: `// Elastic ease in
t = time / thisComp.duration;
if (t <= 0) value1;
else if (t >= 1) value2;
else {
  c4 = (2 * Math.PI) / 3;
  easedT = t === 0 ? 0 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  value1 + (value2 - value1) * easedT;
}`,
        description: 'Elastic wind-up effect',
        useBuiltIn: false,
        category: 'complex'
      },
      
      easeOutElastic: {
        expression: `// Elastic ease out
t = time / thisComp.duration;
if (t <= 0) value1;
else if (t >= 1) value2;
else {
  c4 = (2 * Math.PI) / 3;
  easedT = t === 0 ? 0 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  value1 + (value2 - value1) * easedT;
}`,
        description: 'Elastic spring-back effect',
        useBuiltIn: false,
        category: 'complex'
      },
      
      easeOutBounce: {
        expression: `// Bounce ease out
t = time / thisComp.duration;
if (t <= 0) value1;
else if (t >= 1) value2;
else {
  n1 = 7.5625;
  d1 = 2.75;
  
  if (t < 1 / d1) {
    easedT = n1 * t * t;
  } else if (t < 2 / d1) {
    easedT = n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    easedT = n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    easedT = n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
  
  value1 + (value2 - value1) * easedT;
}`,
        description: 'Bouncing deceleration effect',
        useBuiltIn: false,
        category: 'complex'
      },
      
      // Special AE-optimized expressions
      easeInOutQuart: {
        expression: `// Optimized using AE's easeIn/easeOut
t = time / thisComp.duration;
if (t <= 0) value1;
else if (t >= 1) value2;
else {
  // Use AE's built-in easeIn and easeOut functions for smoother performance
  easedT = t < 0.5 
    ? easeIn(t * 2, 0, 0.5) * 2
    : 1 - easeIn((1 - t) * 2, 0, 0.5) * 2;
  linear(easedT, value1, value2);
}`,
        description: 'Uses AE built-in easeIn/easeOut functions',
        useBuiltIn: true,
        category: 'builtin'
      }
    };
  }
  
  /**
   * Generate ExtendScript to apply expression to selected properties
   */
  static generateExpressionScript(easingName: string): string {
    const mapping = this.getExpression(easingName);
    
    return `
// Apply ${easingName} expression to selected properties
function apply${easingName}Expression() {
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
    
    app.beginUndoGroup("Apply ${easingName} Expression");
    
    var appliedCount = 0;
    var expressionCode = \`${mapping.expression.replace(/`/g, '\\`')}\`;
    
    try {
        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];
            var selectedProps = layer.selectedProperties;
            
            if (selectedProps.length === 0) {
                // Apply to common transform properties if they exist and are animated
                var transformProps = [
                    layer.transform.position,
                    layer.transform.scale, 
                    layer.transform.rotation,
                    layer.transform.opacity
                ];
                
                for (var t = 0; t < transformProps.length; t++) {
                    if (transformProps[t].canSetExpression && 
                        (transformProps[t].numKeys > 0 || transformProps[t].isTimeVarying)) {
                        applyExpressionToProperty(transformProps[t]);
                        appliedCount++;
                    }
                }
            } else {
                for (var j = 0; j < selectedProps.length; j++) {
                    var prop = selectedProps[j];
                    if (applyExpressionToProperty(prop)) {
                        appliedCount++;
                    }
                }
            }
        }
        
        app.endUndoGroup();
        return "Applied ${easingName} expression to " + appliedCount + " properties";
        
    } catch (e) {
        app.endUndoGroup();
        return "Error applying expression: " + e.toString();
    }
    
    function applyExpressionToProperty(property) {
        if (!property || !property.canSetExpression) {
            return false;
        }
        
        try {
            // Store original keyframe values for value1 and value2
            var startVal, endVal;
            
            if (property.numKeys >= 2) {
                startVal = property.keyValue(1);
                endVal = property.keyValue(property.numKeys);
            } else {
                // Use current value and assume animation range
                startVal = property.value;
                endVal = property.value;
            }
            
            // Replace placeholders in expression
            var finalExpression = expressionCode;
            
            // For simple properties, replace value1/value2
            if (typeof startVal === "number") {
                finalExpression = finalExpression.replace(/value1/g, startVal.toString());
                finalExpression = finalExpression.replace(/value2/g, endVal.toString());
            }
            
            // Apply the expression
            property.expression = finalExpression;
            return true;
            
        } catch (propError) {
            return false;
        }
    }
}

// Execute the function
apply${easingName}Expression();`;
  }
  
  /**
   * Generate a simplified expression for basic use cases
   */
  static generateSimpleExpression(easingName: string, startValue: number, endValue: number): string {
    const mapping = this.getExpression(easingName, startValue, endValue, 1);
    
    // Simplified version that works with any timeline duration
    return mapping.expression
      .replace(/thisComp\.duration/g, 'thisComp.duration')
      .replace(/value1/g, startValue.toString())
      .replace(/value2/g, endValue.toString());
  }
  
  /**
   * Get list of expressions that use AE built-in functions
   */
  static getBuiltInExpressions(): string[] {
    const mappings = this.getExpressionMappings();
    return Object.keys(mappings).filter(key => mappings[key].useBuiltIn);
  }
  
  /**
   * Get categorized list of all available expressions
   */
  static getCategorizedExpressions(): Record<string, string[]> {
    const mappings = this.getExpressionMappings();
    const categories: Record<string, string[]> = {
      builtin: [],
      custom: [],
      complex: []
    };
    
    Object.entries(mappings).forEach(([name, mapping]) => {
      categories[mapping.category].push(name);
    });
    
    return categories;
  }
}

// Export for use in the Svelte panel
export { EasingToExpressionConverter, type ExpressionMapping };