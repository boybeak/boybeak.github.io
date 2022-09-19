---
layout: default
---

<ul>
  {% for post in site.posts %}
    <li>
      <h3><a href="{{ post.url }}">{{ post.title }}</a></h3>
      {{ post.excerpt }}
      <img src="/assets/img/tag-outline.png" width="24" height="24"/>
      {{ post.tags }}
      <br>
    </li>
  {% endfor %}
</ul>