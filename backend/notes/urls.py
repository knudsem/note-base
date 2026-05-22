from django.urls import path

from notes.views import NoteDetailView, NoteListCreateView


urlpatterns = [
    path(
        "workspaces/<uuid:workspace_id>/notes",
        NoteListCreateView.as_view(),
        name="note-list-create",
    ),
    path(
        "workspaces/<uuid:workspace_id>/notes/<uuid:note_id>",
        NoteDetailView.as_view(),
        name="note-detail",
    ),
]
