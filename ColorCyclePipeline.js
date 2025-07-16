

import Phaser from 'phaser';

const fragShader = `
#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D uMainSampler;
uniform float u_time;

varying vec2 outTexCoord;

void main() {
    vec4 color = texture2D(uMainSampler, outTexCoord);
    
    // Create a vibrant, cycling color effect
    float r = 0.5 + 0.5 * cos(u_time + outTexCoord.y * 5.0);
    float g = 0.5 + 0.5 * sin(u_time + outTexCoord.x * 5.0);
    float b = 0.5 + 0.5 * cos(u_time + outTexCoord.y * 3.0 + 1.5);

    vec3 overlayColor = vec3(r, g, b);

    // Mix the original texture color with the cycling color
    // 'overlay' blend mode effect
    vec3 finalColor = 2.0 * color.rgb * overlayColor;

    gl_FragColor = vec4(finalColor, color.a);
}
`;

export class ColorCyclePipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    constructor(game) {
        super({
            game: game,
            renderTarget: true,
            fragShader: fragShader,
            uniforms: [
                'uProjectionMatrix',
                'uMainSampler',
                'u_time'
            ]
        });
        this._time = 0;
    }

    onPreRender() {
        this._time += 0.005;
        this.set1f('u_time', this._time);
    }
}

