---
layout: default
---

<ul>
  {% for post in site.posts %}
    <li>
      <h3><a href="{{ post.url }}">{{ post.title }}</a></h3>
      {{ post.excerpt }}
      <img src="/assets/img/account-outline.png" width="15" height="15"/>
      **By** {{ post.author }}   **Tags: **{{ post.tags }}
      <br><br>
    </li>
  {% endfor %}
</ul>