---
layout: default
---

<ul>
  {% for post in site.posts %}
    <li>
      <h3><a href="{{ post.url }}">{{ post.title }}</a></h3>
      {{ post.excerpt }}
      {% if post.author %}
      <b>By</b> {{ post.author }}
      {% endif %}
      {% if post.tags %}
      <b style="margin-left:12px;">Tags:</b> {{ post.tags }}
      {% endif %}
      <br><br>
    </li>
  {% endfor %}
</ul>