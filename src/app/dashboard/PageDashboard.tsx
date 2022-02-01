import React, { useRef } from 'react';

import {
  Alert,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { Page, PageContent } from '@/app/layout';
import { db } from '@/config/db';

export const PageDashboard = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const sessionIdToDelete = useRef<number>();

  const sessions = useLiveQuery(() => db.sessions.toArray());
  const isSessionsEmpty = !sessions?.length;
  const filteredSessions = sessions?.sort((a, b) => {
    if (a.updatedAt > b.updatedAt) return -1;
    if (a.updatedAt < b.updatedAt) return 1;
    return 0;
  });

  const createNewSession = async () => {
    const now = new Date();
    const sessionName = uuidv4();
    const sessionId = await db.sessions.add({
      name: sessionName,
      createdAt: now,
      updatedAt: now,
    });

    history.push(`/session/${sessionId}`);
  };

  const handleConfirmDelete = (sessionId) => () => {
    sessionIdToDelete.current = sessionId;
    onOpen();
  };

  const handleOpenSession = (sessionId) => () => {
    db.sessions.update(sessionId, { updatedAt: new Date() });
    history.push(`session/${sessionId}`);
  };

  return (
    <Page>
      <PageContent>
        <Heading size="md" mb="4">
          {t('dashboard:title')}
        </Heading>

        {isSessionsEmpty && (
          <Alert borderRadius="md">
            <AlertIcon />
            <Box flex={1}>
              <AlertTitle fontSize="lg">No session found.</AlertTitle>
            </Box>
            <Button onClick={createNewSession}>Create a new one</Button>
          </Alert>
        )}

        {!isSessionsEmpty && (
          <Button
            colorScheme="brand"
            size="lg"
            mb={4}
            onClick={createNewSession}
          >
            Create new session
          </Button>
        )}

        <Stack>
          {filteredSessions?.map((session) => (
            <Flex
              flexDir="column"
              key={session.id}
              shadow="md"
              borderRadius="md"
              borderWidth={1}
            >
              <Flex mb={2} flexDir="column" p={4}>
                <Text fontWeight="bold">
                  Session du {dayjs(session.createdAt).format('DD/MM/YYYY')}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Last opened{' '}
                  {dayjs(session.updatedAt).format('DD/MM/YYYY HH:mm')}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {session.samples?.length
                    ? `${session.samples?.length || 0} Sample${
                        session.samples?.length > 1 ? 's' : ''
                      }`
                    : 'No samples'}
                </Text>
              </Flex>
              <Flex
                alignItems="center"
                justifyContent="center"
                borderTopWidth={1}
              >
                <Button
                  variant="ghost"
                  borderTopRadius={0}
                  borderBottomRightRadius={0}
                  textAlign="center"
                  flex={1}
                  colorScheme="red"
                  onClick={handleConfirmDelete(session.id)}
                >
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  borderTopRadius={0}
                  borderBottomLeftRadius={0}
                  textAlign="center"
                  flex={1}
                  borderLeftWidth={1}
                  onClick={handleOpenSession(session.id)}
                >
                  Open
                </Button>
              </Flex>
            </Flex>
          ))}
        </Stack>

        <Modal isOpen={isOpen} onClose={onClose} isCentered size="xs">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Delete session</ModalHeader>
            <ModalBody>
              <Text>
                You are about to delete the session. This operation cannot be
                undone. Continue ?
              </Text>
            </ModalBody>

            <ModalFooter px={0} pb={0} justifyContent="center">
              <Button
                flex={1}
                borderTopRadius={0}
                borderBottomRightRadius={0}
                borderTopWidth={1}
                variant="ghost"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                flex={1}
                borderTopRadius={0}
                borderBottomLeftRadius={0}
                borderLeftWidth={1}
                colorScheme="red"
                onClick={() => db.sessions.delete(sessionIdToDelete.current)}
              >
                Confirm deletion
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </PageContent>
    </Page>
  );
};
