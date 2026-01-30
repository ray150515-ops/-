// Minecraft社区 - Cloudflare Worker API
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS头
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };
    
    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }
    
    try {
      // API路由
      if (path === '/api/posts') {
        if (request.method === 'GET') {
          // 获取帖子列表
          const posts = await env.MINECRAFT_KV.get('posts', 'json') || [];
          return new Response(JSON.stringify(posts), { headers });
        }
        
        if (request.method === 'POST') {
          // 创建新帖子
          const data = await request.json();
          const posts = await env.MINECRAFT_KV.get('posts', 'json') || [];
          
          const newPost = {
            id: Date.now(),
            ...data,
            createdAt: new Date().toISOString(),
            author: data.author || '匿名玩家'
          };
          
          posts.unshift(newPost);
          await env.MINECRAFT_KV.put('posts', JSON.stringify(posts));
          
          return new Response(JSON.stringify(newPost), { 
            status: 201,
            headers 
          });
        }
      }
      
      if (path === '/api/servers') {
        if (request.method === 'GET') {
          // 获取服务器列表
          const servers = await env.MINECRAFT_KV.get('servers', 'json') || [];
          return new Response(JSON.stringify(servers), { headers });
        }
        
        if (request.method === 'POST') {
          // 添加新服务器
          const data = await request.json();
          const servers = await env.MINECRAFT_KV.get('servers', 'json') || [];
          
          const newServer = {
            id: Date.now(),
            ...data,
            createdAt: new Date().toISOString(),
            author: data.author || '匿名'
          };
          
          servers.unshift(newServer);
          await env.MINECRAFT_KV.put('servers', JSON.stringify(servers));
          
          return new Response(JSON.stringify(newServer), { 
            status: 201,
            headers 
          });
        }
      }
      
      if (path === '/api/auth/register' && request.method === 'POST') {
        // 用户注册
        const { username, password } = await request.json();
        
        if (!username || !password) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: '用户名和密码不能为空' 
          }), { headers });
        }
        
        // 获取现有用户
        const users = await env.MINECRAFT_KV.get('users', 'json') || {};
        
        if (users[username]) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: '用户名已存在' 
          }), { headers });
        }
        
        // 创建用户（实际应该加密密码）
        users[username] = {
          id: Date.now(),
          username,
          password, // 警告：实际应用中应该使用bcrypt加密
          createdAt: new Date().toISOString()
        };
        
        await env.MINECRAFT_KV.put('users', JSON.stringify(users));
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: '注册成功' 
        }), { headers });
      }
      
      if (path === '/api/auth/login' && request.method === 'POST') {
        // 用户登录
        const { username, password } = await request.json();
        const users = await env.MINECRAFT_KV.get('users', 'json') || {};
        const user = users[username];
        
        if (!user || user.password !== password) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: '用户名或密码错误' 
          }), { headers });
        }
        
        // 创建简单的token（实际应该用JWT）
        const token = btoa(JSON.stringify({
          userId: user.id,
          username: user.username,
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天过期
        }));
        
        return new Response(JSON.stringify({ 
          success: true,
          token,
          user: {
            id: user.id,
            username: user.username
          }
        }), { headers });
      }
      
      if (path === '/api/stats' && request.method === 'GET') {
        // 获取统计数据
        const posts = await env.MINECRAFT_KV.get('posts', 'json') || [];
        const servers = await env.MINECRAFT_KV.get('servers', 'json') || [];
        const users = await env.MINECRAFT_KV.get('users', 'json') || {};
        
        return new Response(JSON.stringify({
          posts: posts.length,
          servers: servers.length,
          users: Object.keys(users).length
        }), { headers });
      }
      
      // 默认返回404
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers
      });
      
    } catch (error) {
      console.error('API Error:', error);
      return new Response(JSON.stringify({ 
        error: 'Server error', 
        message: error.message 
      }), {
        status: 500,
        headers
      });
    }
  }
};