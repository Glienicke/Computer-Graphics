#version 300 es
precision mediump float;

out vec4 FragColor;

uniform float ambientStrength, specularStrength, diffuseStrength,shininess;

in vec3 Normal;//法向量
in vec3 FragPos;//相机观察的片元位置
in vec2 TexCoord;//纹理坐标
in vec4 FragPosLightSpace;//光源观察的片元位置

uniform vec3 viewPos;//相机位置
uniform vec4 u_lightPosition; //光源位置	
uniform vec3 lightColor;//入射光颜色

uniform sampler2D diffuseTexture;
uniform sampler2D depthTexture;
uniform samplerCube cubeSampler;//盒子纹理采样器


float shadowCalculation(vec4 fragPosLightSpace, vec3 normal, vec3 lightDir)
{
    float shadow=0.0;  //非阴影
    /*TODO3: 添加阴影计算，返回1表示是阴影，返回0表示非阴影*/

    // 从齐次坐标转到 NDC
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    // [-1,1] → [0,1]
    projCoords = projCoords * 0.5 + 0.5;

    // 超出深度贴图范围直接认为不在阴影中
    if (projCoords.z > 1.0)
        return 0.0;

    // 采样深度贴图中记录的最近深度
    float closestDepth = texture(depthTexture, projCoords.xy).r;
    // 当前片元在光源空间下的深度
    float currentDepth = projCoords.z;

    // 加一点 bias 防止自阴影
    float bias = max(0.005, 0.05 * (1.0 - dot(normal, lightDir)));

    // 当前深度 + bias > 最近深度 → 阴影 = 1
    shadow = currentDepth - bias > closestDepth ? 1.0 : 0.0;

    return shadow;
}       


void main()
{
    
    //采样纹理颜色
    vec3 TextureColor = texture(diffuseTexture, TexCoord).xyz;

    //计算光照颜色
 	vec3 norm = normalize(Normal);
	vec3 lightDir;
	if(u_lightPosition.w==1.0) 
        lightDir = normalize(u_lightPosition.xyz - FragPos);
	else lightDir = normalize(u_lightPosition.xyz);
	vec3 viewDir = normalize(viewPos - FragPos);
	vec3 halfDir = normalize(viewDir + lightDir);


    /*TODO2:根据phong shading方法计算ambient,diffuse,specular*/
    vec3 ambient  = ambientStrength * lightColor;

    float diff    = max(dot(norm, lightDir), 0.0);
    vec3 diffuse  = diffuseStrength * diff * lightColor;

    float spec    = pow(max(dot(norm, halfDir), 0.0), shininess);
    vec3 specular = specularStrength * spec * lightColor;

    vec3 lightReflectColor = ambient + diffuse + specular;

    // 判定是否阴影（shadow=1 表示阴影）
    float shadow = shadowCalculation(FragPosLightSpace, norm, lightDir);
    
    // 最终颜色（适当减少阴影强度，让地面不完全黑掉）
    vec3 resultColor = (1.0 - shadow * 0.5) * lightReflectColor * TextureColor;
    
    FragColor = vec4(resultColor, 1.0);
}
