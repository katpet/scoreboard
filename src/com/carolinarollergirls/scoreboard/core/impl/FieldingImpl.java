package com.carolinarollergirls.scoreboard.core.impl;

import com.carolinarollergirls.scoreboard.core.Fielding;
import com.carolinarollergirls.scoreboard.core.FloorPosition;
import com.carolinarollergirls.scoreboard.core.Position;
import com.carolinarollergirls.scoreboard.core.Role;
import com.carolinarollergirls.scoreboard.core.Skater;
import com.carolinarollergirls.scoreboard.core.Team;
import com.carolinarollergirls.scoreboard.core.TeamJam;
import com.carolinarollergirls.scoreboard.event.ParentOrderedScoreBoardEventProviderImpl;
import com.carolinarollergirls.scoreboard.event.ScoreBoardEvent.PermanentProperty;

public class FieldingImpl extends ParentOrderedScoreBoardEventProviderImpl<Fielding> implements Fielding {
    public FieldingImpl(TeamJam teamJam, Position position) {
        super(teamJam, Value.ID, position.getId(), TeamJam.Child.FIELDING, Fielding.class, Value.class);
        this.teamJam = teamJam;
        set(Value.POSITION, position);
        addWriteProtection(Value.POSITION);
        addReference(new ElementReference(Value.SKATER, Skater.class, Skater.Child.FIELDING));
        setPenaltyBox(false);
    }

    public String getProviderId() { return getPosition().getProviderId(); }

    protected Object computeValue(PermanentProperty prop, Object value, Object last, Flag flag) {
        if (prop == Value.PENALTY_BOX && getSkater() == null) { return false; }
        return value;
    }
    protected void valueChanged(PermanentProperty prop, Object value, Object last, Flag flag) {
        if (prop == Value.PENALTY_BOX && isCurrent() && (Boolean)value &&
                getPosition().getFloorPosition() == FloorPosition.JAMMER &&
                scoreBoard.isInJam() && teamJam.getLeadJammer().equals(Team.LEAD_LEAD)) {
            teamJam.setLeadJammer(Team.LEAD_LOST_LEAD);
        }
    }

    public TeamJam getTeamJam() { return teamJam; }
    public Position getPosition() { return (Position)get(Value.POSITION); }

    public boolean isCurrent() { return teamJam.isRunningOrUpcoming(); }

    public Role getCurrentRole() { return getPosition().getFloorPosition().getRole(teamJam); }

    public Skater getSkater() { return (Skater)get(Value.SKATER); }
    public void setSkater(Skater s) { set(Value.SKATER, s); }

    public boolean getPenaltyBox() { return (Boolean)get(Value.PENALTY_BOX); }
    public void setPenaltyBox(boolean p) { set(Value.PENALTY_BOX, p); }

    private TeamJam teamJam;
}
