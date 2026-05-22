from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from core.authentication import IsAuthenticatedByHeader
from core.pagination import ContractPagination
from notes import services
from notes.serializers import NoteCreatePayload, NoteSerializer, NoteUpdatePayload
from workspaces.permissions import IsWorkspaceMember


class NoteListCreateView(APIView):
    permission_classes = [IsAuthenticatedByHeader, IsWorkspaceMember]

    def get(self, request, workspace_id):
        search = request.query_params.get("search")
        queryset = services.list_notes(self.workspace, search=search)
        paginator = ContractPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        return paginator.get_paginated_response(NoteSerializer(page, many=True).data)

    def post(self, request, workspace_id):
        payload = NoteCreatePayload(data=request.data)
        payload.is_valid(raise_exception=True)

        note = services.create_note(
            workspace=self.workspace,
            author_id=request.user.user_id,
            title=payload.validated_data["title"],
            content=payload.validated_data["content"],
        )
        return Response(NoteSerializer(note).data, status=status.HTTP_201_CREATED)


class NoteDetailView(APIView):
    permission_classes = [IsAuthenticatedByHeader, IsWorkspaceMember]

    def delete(self, request, workspace_id, note_id):
        services.delete_note(
            workspace=self.workspace,
            note_id=str(note_id),
            actor_id=request.user.user_id,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, workspace_id, note_id):
        payload = NoteUpdatePayload(data=request.data)
        payload.is_valid(raise_exception=True)

        note = services.update_note(
            workspace=self.workspace,
            note_id=str(note_id),
            actor_id=request.user.user_id,
            title=payload.validated_data.get("title"),
            content=payload.validated_data.get("content"),
        )
        return Response(NoteSerializer(note).data, status=status.HTTP_200_OK)
