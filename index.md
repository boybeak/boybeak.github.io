---
layout: default
---

<ul>
  {% for post in site.posts %}
    <li>
      <h3><a href="{{ post.url }}">{{ post.title }}</a></h3>
      {{ post.excerpt }}
      <img src="/assets/img/account-outline.svg" width="14" height="14"/>
      {{ post.author }}
      <img src="/assets/img/tag-outline.png" width="14" height="14"/>
      {{ post.tags }}
      <br><br>
    </li>
  {% endfor %}
</ul>