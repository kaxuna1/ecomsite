-- Fix Theme Preset Colors for Better Contrast and Readability
-- This script addresses contrast issues in theme presets, particularly Ocean Breeze

-- Fix Ocean Breeze theme preset
-- Issues:
--   - text.tertiary was #67e8f9 (light cyan) - invisible on white background
--   - text.secondary was #155e75 (dark teal) - better but could be improved for readability
UPDATE theme_presets
SET tokens = '{"version":"1.0.0","metadata":{"displayName":"Ocean Breeze","description":"Coastal blues and teals","author":"Luxia Team","category":"light"},"color":{"brand":{"primary":"#06b6d4","secondary":"#0891b2","accent":"#164e63"},"semantic":{"background":{"primary":"#ffffff","secondary":"#f0fdfa","elevated":"#ffffff"},"text":{"primary":"#083344","secondary":"#0e7490","tertiary":"#6b7280","inverse":"#ffffff"},"border":{"default":"#cffafe","strong":"#a5f3fc"},"interactive":{"default":"#06b6d4","hover":"#0891b2","active":"#0e7490","disabled":"#cffafe"},"feedback":{"success":"#14b8a6","warning":"#f59e0b","error":"#ef4444","info":"#3b82f6"}}},"typography":{"fontFamily":{"display":"Lora, serif","body":"Open Sans, sans-serif","mono":"Fira Code, monospace"},"fontSize":{"xs":"0.75rem","sm":"0.875rem","base":"1rem","lg":"1.125rem","xl":"1.25rem","2xl":"1.5rem","3xl":"1.875rem","4xl":"2.25rem","5xl":"3rem"},"fontWeight":{"light":"300","normal":"400","medium":"500","semibold":"600","bold":"700"},"lineHeight":{"tight":"1.25","normal":"1.5","relaxed":"1.75"},"letterSpacing":{"tight":"-0.05em","normal":"0","wide":"0.025em","wider":"0.05em"}},"spacing":{"preset":"normal","xs":"0.25rem","sm":"0.5rem","md":"1rem","lg":"1.5rem","xl":"2rem","2xl":"3rem","3xl":"4rem"},"border":{"width":{"thin":"1px","medium":"2px","thick":"4px"},"radius":{"sm":"0.5rem","md":"0.75rem","lg":"1rem","xl":"1.5rem","2xl":"2rem","full":"9999px"}},"shadow":{"sm":"0 1px 2px 0 rgba(6, 182, 212, 0.1)","md":"0 4px 6px -1px rgba(6, 182, 212, 0.15)","lg":"0 10px 15px -3px rgba(6, 182, 212, 0.2)","xl":"0 20px 25px -5px rgba(6, 182, 212, 0.25)"}}'
WHERE name = 'ocean-breeze';

-- Verify Bold & Bright theme has good contrast
UPDATE theme_presets
SET tokens = '{"version":"1.0.0","metadata":{"displayName":"Bold & Bright","description":"Vibrant and playful","author":"Luxia Team","category":"light"},"color":{"brand":{"primary":"#ff6b6b","secondary":"#4ecdc4","accent":"#ffe66d"},"semantic":{"background":{"primary":"#ffffff","secondary":"#fff9f0","elevated":"#ffffff"},"text":{"primary":"#2d3436","secondary":"#636e72","tertiary":"#95a5a6","inverse":"#ffffff"},"border":{"default":"#dfe6e9","strong":"#b2bec3"},"interactive":{"default":"#ff6b6b","hover":"#ff5252","active":"#e63946","disabled":"#dfe6e9"},"feedback":{"success":"#00d2d3","warning":"#fdcb6e","error":"#d63031","info":"#74b9ff"}}},"typography":{"fontFamily":{"display":"Poppins, sans-serif","body":"Open Sans, sans-serif","mono":"Source Code Pro, monospace"},"fontSize":{"xs":"0.75rem","sm":"0.875rem","base":"1rem","lg":"1.125rem","xl":"1.25rem","2xl":"1.5rem","3xl":"1.875rem","4xl":"2.25rem","5xl":"3rem"},"fontWeight":{"light":"300","normal":"400","medium":"500","semibold":"600","bold":"700"},"lineHeight":{"tight":"1.25","normal":"1.5","relaxed":"1.75"},"letterSpacing":{"tight":"-0.05em","normal":"0","wide":"0.025em","wider":"0.05em"}},"spacing":{"preset":"spacious","xs":"0.5rem","sm":"1rem","md":"1.5rem","lg":"2.5rem","xl":"4rem","2xl":"6rem","3xl":"8rem"},"border":{"width":{"thin":"1px","medium":"2px","thick":"4px"},"radius":{"sm":"0.5rem","md":"0.75rem","lg":"1rem","xl":"1.5rem","2xl":"2rem","full":"9999px"}},"shadow":{"sm":"0 2px 4px 0 rgba(0, 0, 0, 0.1)","md":"0 4px 8px -1px rgba(0, 0, 0, 0.15)","lg":"0 10px 20px -3px rgba(0, 0, 0, 0.2)","xl":"0 20px 30px -5px rgba(0, 0, 0, 0.25)"}}'
WHERE name = 'bold-bright';

-- Update Minimalist Light for better tertiary text contrast
UPDATE theme_presets
SET tokens = '{"version":"1.0.0","metadata":{"displayName":"Minimalist Light","description":"Clean minimal design","author":"Luxia Team","category":"light"},"color":{"brand":{"primary":"#000000","secondary":"#f5f5f5","accent":"#666666"},"semantic":{"background":{"primary":"#ffffff","secondary":"#fafafa","elevated":"#ffffff"},"text":{"primary":"#000000","secondary":"#666666","tertiary":"#9ca3af","inverse":"#ffffff"},"border":{"default":"#e0e0e0","strong":"#cccccc"},"interactive":{"default":"#000000","hover":"#333333","active":"#666666","disabled":"#cccccc"},"feedback":{"success":"#4caf50","warning":"#ff9800","error":"#f44336","info":"#2196f3"}}},"typography":{"fontFamily":{"display":"Inter, sans-serif","body":"Inter, sans-serif","mono":"Fira Code, monospace"},"fontSize":{"xs":"0.75rem","sm":"0.875rem","base":"1rem","lg":"1.125rem","xl":"1.25rem","2xl":"1.5rem","3xl":"1.875rem","4xl":"2.25rem","5xl":"3rem"},"fontWeight":{"light":"300","normal":"400","medium":"500","semibold":"600","bold":"700"},"lineHeight":{"tight":"1.25","normal":"1.5","relaxed":"1.75"},"letterSpacing":{"tight":"-0.05em","normal":"0","wide":"0.025em","wider":"0.05em"}},"spacing":{"preset":"compact","xs":"0.125rem","sm":"0.25rem","md":"0.5rem","lg":"0.75rem","xl":"1rem","2xl":"1.5rem","3xl":"2rem"},"border":{"width":{"thin":"1px","medium":"2px","thick":"4px"},"radius":{"sm":"0.125rem","md":"0.25rem","lg":"0.375rem","xl":"0.5rem","2xl":"0.75rem","full":"9999px"}},"shadow":{"sm":"0 1px 2px 0 rgba(0, 0, 0, 0.03)","md":"0 2px 4px -1px rgba(0, 0, 0, 0.06)","lg":"0 4px 8px -2px rgba(0, 0, 0, 0.08)","xl":"0 8px 16px -4px rgba(0, 0, 0, 0.1)"}}'
WHERE name = 'minimalist-light';

-- Display results
SELECT
  name,
  display_name,
  CASE
    WHEN tokens::jsonb -> 'color' -> 'semantic' -> 'text' ->> 'tertiary' IS NOT NULL
    THEN tokens::jsonb -> 'color' -> 'semantic' -> 'text' ->> 'tertiary'
    ELSE 'Not set'
  END as tertiary_text_color,
  CASE
    WHEN tokens::jsonb -> 'color' -> 'semantic' -> 'text' ->> 'secondary' IS NOT NULL
    THEN tokens::jsonb -> 'color' -> 'semantic' -> 'text' ->> 'secondary'
    ELSE 'Not set'
  END as secondary_text_color
FROM theme_presets
ORDER BY display_order;

-- Also update the active Luxia default theme if it exists
UPDATE themes
SET tokens = '{"version":"1.0.0","metadata":{"displayName":"Luxia Default","description":"Default Luxia brand theme","author":"Luxia Team","category":"light"},"color":{"brand":{"primary":"#8bba9c","secondary":"#e8c7c8","accent":"#0f172a"},"semantic":{"background":{"primary":"#ffffff","secondary":"#f9fafb","elevated":"#ffffff"},"text":{"primary":"#111827","secondary":"#4b5563","tertiary":"#9ca3af","inverse":"#ffffff"},"border":{"default":"#e5e7eb","strong":"#d1d5db"},"interactive":{"default":"#8bba9c","hover":"#7aa88a","active":"#6a967a","disabled":"#d1d5db"},"feedback":{"success":"#10b981","warning":"#f59e0b","error":"#ef4444","info":"#3b82f6"}}},"typography":{"fontFamily":{"display":"Playfair Display, serif","body":"Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif","mono":"Fira Code, Courier New, monospace"},"fontSize":{"xs":"0.75rem","sm":"0.875rem","base":"1rem","lg":"1.125rem","xl":"1.25rem","2xl":"1.5rem","3xl":"1.875rem","4xl":"2.25rem","5xl":"3rem"},"fontWeight":{"light":"300","normal":"400","medium":"500","semibold":"600","bold":"700"},"lineHeight":{"tight":"1.25","normal":"1.5","relaxed":"1.75"},"letterSpacing":{"tight":"-0.05em","normal":"0","wide":"0.025em","wider":"0.05em"}},"spacing":{"preset":"normal","xs":"0.25rem","sm":"0.5rem","md":"1rem","lg":"1.5rem","xl":"2rem","2xl":"3rem","3xl":"4rem"},"border":{"width":{"thin":"1px","medium":"2px","thick":"4px"},"radius":{"sm":"0.25rem","md":"0.5rem","lg":"0.75rem","xl":"1rem","2xl":"1.5rem","full":"9999px"}},"shadow":{"sm":"0 1px 2px 0 rgba(0, 0, 0, 0.05)","md":"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)","lg":"0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)","xl":"0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"}}'
WHERE name = 'luxia-default';
