$(function () {
  'use strict';
  createPenaltyBoxJammersPage('PenaltyBoxJammers');
  createPenaltyBoxBlockersPage('PenaltyBoxTeam1Blockers', TeamId.Team1);
  createPenaltyBoxBlockersPage('PenaltyBoxTeam2Blockers', TeamId.Team2);
  createPenaltyBoxBothTeamsPage('PenaltyBoxBothTeams');

  setupCallbacks();
  setupButtonsStyle();

  WS.AutoRegister();
  WS.Connect();
});
