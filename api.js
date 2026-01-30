// 简单可用的Minecraft社区API
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS头
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };
    
    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }
    
    try {
      // 帖子API
      if (path === '/api/posts') {
        if (request.method === 'GET') {
          // 获取帖子列表
          const posts = await env.KV.get('posts', 'json') || [];
          return new Response(JSON.stringify(posts), { headers });
        }
        
        if (request.method === 'POST') {
          // 创建新帖子
          const data = await request.json();
          
          // 验证数据
          if (!data.title || !data.content) {
            return new Response(JSON.stringify({ error: '标题和内容不能为空' }), {
              status: 400,
              headers
            });
          }
          
          const posts = await env.KV.get('posts', 'json') || [];
          
          const newPost = {
            id: Date.now(),
            title: data.title,
            content: data.content,
            platform: data.platform || 'java',
            author: data.author || '匿名玩家',
            createdAt: new Date().toISOString()
          };
          
          posts.unshift(newPost);
          await env.KV.put('posts', JSON.stringify(posts));
          
          return new Response(JSON.stringify(newPost), { 
            status: 201,
            headers 
          });
        }
      }
      
      // 服务器API
      if (path === '/api/servers') {
        if (request.method === 'GET') {
          const servers = await env.KV.get('servers', 'json') || [];
          return new Response(JSON.stringify(servers), { headers });
        }
        
        if (request.method === 'POST') {
          const data = await request.json();
          
          if (!data.name || !data.ip || !data.description) {
            return new Response(JSON.stringify({ error: '请填写所有字段' }), {
              status: 400,
              headers
            });
          }
          
          const servers = await env.KV.get('servers', 'json') || [];
          
          const newServer = {
            id: Date.now(),
            name: data.name,
            ip: data.ip,
            description: data.description,
            platform: data.platform || 'java',
            author: data.author || '匿名',
            createdAt: new Date().toISOString()
          };
          
          servers.unshift(newServer);
          await env.KV.put('servers', JSON.stringify(servers));
          
          return new Response(JSON.stringify(newServer), { 
            status: 201,
            headers 
          });
        }
      }
      
      // 认证API（简化版）
      if (path === '/api/auth/login') {
        const data = await request.json();
        
        // 这里简化了，实际应该验证密码
        const users = await env.KV.get('users', 'json') || {};
        
        if (!users[data.username]) {
          // 自动创建用户（简化）
          users[data.username] = {
            id: Date.now(),
            username: data.username,
            createdAt: new Date().toISOString()
          };
          await env.KV.put('users', JSON.stringify(users));
        }
        
        return new Response(JSON.stringify({
          success: true,
          user: {
            username: data.username,
            id: users[data.username]?.id || Date.now()
          }
        }), { headers });
      }
      
      // 统计数据
      if (path === '/api/stats') {
        const posts = await env.KV.get('posts', 'json') || [];
        const servers = await env.KV.get('servers', 'json') || [];
        const users = await env.KV.get('users', 'json') || {};
        
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