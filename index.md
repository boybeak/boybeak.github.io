---
layout: default
---

<ul>
  {% for post in site.posts %}
    <li>
      <h3><a href="{{ post.url }}">{{ post.title }}</a></h3>
      {{ post.excerpt }}
      <img src="/assets/img/tag-outline.png" width="16" height="16"/>
      {{ post.tags }}
      <br/>
    </li>
  {% endfor %}
</ul>